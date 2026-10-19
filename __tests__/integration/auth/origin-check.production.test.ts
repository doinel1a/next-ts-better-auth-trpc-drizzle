import { afterAll, describe, expect, it, vi } from 'vitest';

import { auth } from '@/server/auth';

import { get, post, statusOf } from '../helpers/auth-http';
import { testUserEmail } from '../helpers/session';

vi.hoisted(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('TEST', '');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

const appOrigin = 'http://localhost:3000';
const otherSite = 'https://evil.example';
const password = 'password1';
const credentials = { email: testUserEmail, password };

async function createUser() {
  await auth.api.signUpEmail({ body: { name: 'Al', email: testUserEmail, password } });
}

async function bodyOf(response: Response) {
  return (await response.json()) as { code?: string } | null;
}

async function codeOf(response: Response) {
  const body = await bodyOf(response);

  return body?.code;
}

describe('where an authentication request comes from, in production', () => {
  describe('from the app itself', () => {
    it('signs a visitor in', async () => {
      await createUser();

      expect(await statusOf(post('/sign-in/email', credentials, { origin: appOrigin }))).toBe(200);
    });

    it('signs a visitor in who already has a cookie', async () => {
      await createUser();

      const response = post('/sign-in/email', credentials, {
        origin: appOrigin,
        cookie: 'better-auth.session_token=abc'
      });

      expect(await statusOf(response)).toBe(200);
    });
  });

  describe('from another site', () => {
    it.each([
      ['with no cookie', {}],
      ['with a cookie', { cookie: 'better-auth.session_token=abc' }]
    ])('refuses a sign in %s', async (_label, extra) => {
      await createUser();

      const response = await post('/sign-in/email', credentials, { origin: otherSite, ...extra });

      expect(response.status).toBe(403);
      expect(await codeOf(response)).toBe('INVALID_ORIGIN');
      expect(response.headers.getSetCookie()).toEqual([]);
    });

    it('refuses a sign up', async () => {
      const response = await post(
        '/sign-up/email',
        { name: 'Al', email: 'new@example.com', password },
        { origin: otherSite }
      );

      expect(response.status).toBe(403);
      expect(await codeOf(response)).toBe('INVALID_ORIGIN');
    });

    it('refuses a request that only says where it comes from with a referer', async () => {
      await createUser();

      const response = await post('/sign-in/email', credentials, {
        referer: `${otherSite}/page`,
        cookie: 'better-auth.session_token=abc'
      });

      expect(response.status).toBe(403);
      expect(await codeOf(response)).toBe('INVALID_ORIGIN');
    });

    it('does not sign the visitor out', async () => {
      await createUser();
      const signedIn = await post('/sign-in/email', credentials, { origin: appOrigin });
      const cookie = signedIn.headers
        .getSetCookie()
        .map((header) => header.split(';', 1)[0] ?? '')
        .join('; ');

      const response = await post('/sign-out', {}, { origin: otherSite, cookie });
      const session = await get('/get-session', { cookie });

      expect(response.status).toBe(403);
      expect(await session.json()).toMatchObject({ user: { email: testUserEmail } });
    });
  });

  describe('without saying where it comes from', () => {
    it('refuses a request that has a cookie but no origin and no referer', async () => {
      await createUser();

      const response = await post('/sign-in/email', credentials, {
        cookie: 'better-auth.session_token=abc'
      });

      expect(response.status).toBe(403);
      expect(await codeOf(response)).toBe('MISSING_OR_NULL_ORIGIN');
    });

    it('refuses a request whose origin is "null"', async () => {
      await createUser();

      const response = await post('/sign-in/email', credentials, {
        origin: 'null',
        cookie: 'better-auth.session_token=abc'
      });

      expect(response.status).toBe(403);
      expect(await codeOf(response)).toBe('MISSING_OR_NULL_ORIGIN');
    });
  });

  describe('where the visitor is sent afterwards', () => {
    it('refuses to send the visitor to another site', async () => {
      await createUser();

      const response = await post(
        '/sign-in/email',
        { ...credentials, callbackURL: `${otherSite}/` },
        { origin: appOrigin }
      );

      expect(response.status).toBe(403);
      expect(await codeOf(response)).toBe('INVALID_CALLBACK_URL');
      expect(response.headers.getSetCookie()).toEqual([]);
    });

    it('sends the visitor to a page of the app', async () => {
      await createUser();

      const response = await post(
        '/sign-in/email',
        { ...credentials, callbackURL: '/dashboard' },
        { origin: appOrigin }
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ redirect: true, url: '/dashboard' });
    });
  });
});
