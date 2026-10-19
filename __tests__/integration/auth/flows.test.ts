import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { accounts, sessions, users } from '~/drizzle/schemas/auth';

import { db } from '@/server/db';

import { get, post, statusOf } from '../helpers/auth-http';

const name = 'Al';
const email = 'user@example.com';
const password = 'password1';

const defaults = { name, email, password };

function signUp(overrides: { name?: string; email?: string; password?: string } = {}) {
  return post('/sign-up/email', { ...defaults, ...overrides });
}

function signIn(overrides: { email?: string; password?: string } = {}) {
  return post('/sign-in/email', { email, password, ...overrides });
}

function signOut(cookie: string) {
  return post('/sign-out', {}, { cookie });
}

function getSession(cookie?: string) {
  return get('/get-session', cookie === undefined ? {} : { cookie });
}

type TBody = {
  code?: string;
  user?: { id?: string; email?: string; name?: string; emailVerified?: boolean };
  session?: { userId?: string };
} | null;

async function bodyOf(response: Response) {
  return (await response.json()) as TBody;
}

async function sessionBodyOf(cookie?: string) {
  return bodyOf(await getSession(cookie));
}

async function userEmailOf(response: Response) {
  const body = await bodyOf(response);

  return body?.user?.email;
}

async function emailVerifiedOf(response: Response) {
  const body = await bodyOf(response);

  return body?.user?.emailVerified;
}

async function codeOf(response: Response) {
  const body = await bodyOf(response);

  return body?.code;
}

async function sessionEmailOf(cookie: string) {
  const body = await sessionBodyOf(cookie);

  return body?.user?.email;
}

function setCookiesOf(response: Response) {
  return response.headers.getSetCookie();
}

function findSetCookie(response: Response, cookieName: string) {
  return setCookiesOf(response).find((cookie) => cookie.startsWith(`${cookieName}=`));
}

/**
What a browser would send back after a response: the `name=value` part of every cookie set.
*/
function cookiesToSend(response: Response, cookieNames?: string[]) {
  return setCookiesOf(response)
    .map((cookie) => cookie.split(';', 1)[0] ?? '')
    .filter(
      (pair) =>
        cookieNames === undefined || cookieNames.some((cookie) => pair.startsWith(`${cookie}=`))
    )
    .join('; ');
}

async function createUserAndSignIn() {
  expect(await statusOf(signUp())).toBe(200);

  const response = await signIn();
  expect(response.status).toBe(200);

  return {
    response,
    sessionOnly: cookiesToSend(response, ['better-auth.session_token']),
    browser: cookiesToSend(response)
  };
}

async function getUser() {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (user === undefined) {
    throw new Error('Expected the user to exist');
  }

  return user;
}

describe('authentication flows', () => {
  describe('signing up', () => {
    it('creates the account and answers with the new user, without signing in', async () => {
      const response = await signUp();

      expect(response.status).toBe(200);
      expect(setCookiesOf(response)).toEqual([]);
      expect(await response.json()).toMatchObject({
        token: null,
        user: { name, email, emailVerified: false }
      });
    });

    it('never sends the password back', async () => {
      const response = await signUp();

      expect(JSON.stringify(await response.json())).not.toContain(password);
    });

    it('keeps the email in lowercase, and lets the visitor sign in with any casing', async () => {
      const response = await signUp({ email: 'User@Example.COM' });

      expect(await userEmailOf(response)).toBe('user@example.com');
      expect(await statusOf(signIn({ email: 'USER@EXAMPLE.COM' }))).toBe(200);
    });

    it.each([
      ['an email that is not an email', { email: 'nope' }],
      ['a missing email', { email: undefined }]
    ])('refuses %s', async (_label, overrides) => {
      const response = await post('/sign-up/email', { ...defaults, ...overrides });

      expect(response.status).toBe(400);
      expect(await codeOf(response)).toBe('VALIDATION_ERROR');
    });

    it('refuses a sign up without a name', async () => {
      const response = await post('/sign-up/email', { email, password });

      expect(response.status).toBe(400);
      expect(await codeOf(response)).toBe('VALIDATION_ERROR');
    });
  });

  // `autoSignIn: false` makes Better Auth answer a duplicate like a new account, so that nobody can
  // find out which emails are registered. Nothing is created, and the password of the existing
  // account stays as it was. It also means the form never gets an "already exists" error, which is
  // why its message says "Request received" and not that an account was created. If `autoSignIn`
  // is ever turned on, these tests fail and the form message has to be looked at again
  describe('signing up with an email that is already registered', () => {
    it('answers like a new account', async () => {
      const first = await signUp();
      const duplicate = await signUp({ password: 'another-password1' });

      expect(duplicate.status).toBe(first.status);
      expect(setCookiesOf(duplicate)).toEqual([]);
      expect(await duplicate.json()).toMatchObject({
        token: null,
        user: { name, email, emailVerified: false }
      });
    });

    it.each([
      ['the same casing', email],
      ['another casing', 'USER@example.com']
    ])('leaves the existing password alone, with %s', async (_label, duplicateEmail) => {
      await signUp();

      await signUp({ email: duplicateEmail, password: 'another-password1' });

      expect(await statusOf(signIn({ password: 'another-password1' }))).toBe(401);
      expect(await statusOf(signIn())).toBe(200);
    });

    it('does not create a second user', async () => {
      await signUp();
      await signUp({ password: 'another-password1' });
      await signUp({ email: 'USER@example.com' });

      const found = await db.select().from(users).where(eq(users.email, email));

      expect(found).toHaveLength(1);
    });
  });

  describe('how the password is kept', () => {
    // The only place where the database is read directly: "not in plain text" cannot be seen from
    // the outside
    it('keeps a hash that is not the password', async () => {
      await signUp();
      const user = await getUser();

      const [account] = await db.select().from(accounts).where(eq(accounts.userId, user.id));

      expect(account?.providerId).toBe('credential');
      expect(account?.password).toBeTruthy();
      expect(account?.password).not.toBe(password);
      expect(account?.password).not.toContain(password);
    });

    it('gives two users with the same password two different hashes', async () => {
      await signUp();
      await signUp({ email: 'other@example.com' });

      const rows = await db.select({ password: accounts.password }).from(accounts);
      const hashes = rows.map((row) => row.password);

      expect(hashes).toHaveLength(2);
      expect(new Set(hashes).size).toBe(2);
    });
  });

  describe('signing in', () => {
    it('answers with the user and sets the session cookies', async () => {
      const { response } = await createUserAndSignIn();

      expect(await response.json()).toMatchObject({ user: { email, name } });
      expect(findSetCookie(response, 'better-auth.session_token')).toBeDefined();
      expect(findSetCookie(response, 'better-auth.session_data')).toBeDefined();
    });

    it('keeps the session cookies out of the reach of scripts, for one week and the cache for 5 minutes', async () => {
      const { response } = await createUserAndSignIn();

      const sessionCookie = findSetCookie(response, 'better-auth.session_token') ?? '';
      const cacheCookie = findSetCookie(response, 'better-auth.session_data') ?? '';

      for (const cookie of [sessionCookie, cacheCookie]) {
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('SameSite=Lax');
        expect(cookie).toContain('Path=/');
      }
      expect(sessionCookie).toContain('Max-Age=604800');
      expect(cacheCookie).toContain('Max-Age=300');
    });

    it('opens a session in the database for every sign in', async () => {
      await createUserAndSignIn();
      await signIn();

      const user = await getUser();
      const found = await db.select().from(sessions).where(eq(sessions.userId, user.id));

      expect(found).toHaveLength(2);
    });

    it('answers a wrong password and an unknown email in exactly the same way', async () => {
      await signUp();

      const wrongPassword = await signIn({ password: 'wrong-password1' });
      const unknownEmail = await signIn({
        email: 'nobody@example.com',
        password: 'wrong-password1'
      });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(await wrongPassword.json()).toEqual({
        message: 'Invalid email or password',
        code: 'INVALID_EMAIL_OR_PASSWORD'
      });
      expect(await unknownEmail.json()).toEqual({
        message: 'Invalid email or password',
        code: 'INVALID_EMAIL_OR_PASSWORD'
      });
      expect(setCookiesOf(wrongPassword)).toEqual([]);
    });

    // `requireEmailVerification` is commented out in the Better Auth config, and no email is sent
    it('does not ask for the email to be verified (known setting)', async () => {
      const { response } = await createUserAndSignIn();

      expect(await emailVerifiedOf(response)).toBe(false);
    });
  });

  describe('the session', () => {
    it('is given to the visitor who has the cookie', async () => {
      const { sessionOnly } = await createUserAndSignIn();
      const user = await getUser();

      const response = await getSession(sessionOnly);

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        user: { id: user.id, email, name },
        session: { userId: user.id }
      });
    });

    it.each([
      ['no cookie at all', undefined],
      ['a session cookie nobody issued', 'better-auth.session_token=abc']
    ])('is empty for a visitor with %s', async (_label, cookie) => {
      expect(await sessionBodyOf(cookie)).toBeNull();
    });

    it('is empty when the cookie was tampered with', async () => {
      const { sessionOnly } = await createUserAndSignIn();
      const tampered = sessionOnly.replace(/.$/, (last) => (last === 'a' ? 'b' : 'a'));

      expect(await sessionBodyOf(tampered)).toBeNull();
    });

    it('is not given to a cookie signed for another session', async () => {
      const first = await createUserAndSignIn();
      const second = cookiesToSend(await signIn(), ['better-auth.session_token']);

      expect(second).not.toBe(first.sessionOnly);
      expect(await sessionEmailOf(first.sessionOnly)).toBe(email);
      expect(await sessionEmailOf(second)).toBe(email);
    });
  });

  describe('signing out', () => {
    it('answers with a success and clears the session cookies', async () => {
      const { browser } = await createUserAndSignIn();

      const response = await signOut(browser);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(findSetCookie(response, 'better-auth.session_token')).toContain('Max-Age=0');
      expect(findSetCookie(response, 'better-auth.session_data')).toContain('Max-Age=0');
    });

    it('closes the session, so the old cookie no longer works', async () => {
      const { sessionOnly, browser } = await createUserAndSignIn();

      await signOut(browser);

      expect(await sessionBodyOf(sessionOnly)).toBeNull();
    });

    it('removes the session from the database', async () => {
      const { browser } = await createUserAndSignIn();
      const user = await getUser();

      await signOut(browser);

      expect(await db.select().from(sessions).where(eq(sessions.userId, user.id))).toHaveLength(0);
    });

    it('leaves the other sessions of the user open', async () => {
      const first = await createUserAndSignIn();
      const secondResponse = await signIn();
      const second = cookiesToSend(secondResponse, ['better-auth.session_token']);

      await signOut(first.browser);

      expect(await sessionBodyOf(first.sessionOnly)).toBeNull();
      expect(await sessionEmailOf(second)).toBe(email);
    });
  });

  describe('deleting a user from the database', () => {
    it('removes its sessions and its account as well', async () => {
      const { sessionOnly } = await createUserAndSignIn();
      const user = await getUser();

      await db.delete(users).where(eq(users.id, user.id));

      expect(await db.select().from(sessions).where(eq(sessions.userId, user.id))).toHaveLength(0);
      expect(await db.select().from(accounts).where(eq(accounts.userId, user.id))).toHaveLength(0);
      expect(await sessionBodyOf(sessionOnly)).toBeNull();
    });

    it('leaves the other users alone', async () => {
      await createUserAndSignIn();
      await signUp({ email: 'other@example.com' });
      const user = await getUser();

      await db.delete(users).where(eq(users.id, user.id));

      const remaining = await db.select().from(users);
      expect(remaining.map((remainingUser) => remainingUser.email)).toEqual(['other@example.com']);
    });
  });
});
