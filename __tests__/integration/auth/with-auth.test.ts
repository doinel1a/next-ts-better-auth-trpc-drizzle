import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { sessions, users } from '~/drizzle/schemas/auth';

import { GET as getProtectedRoute } from '@/app/api/v1/test/route';
import { auth } from '@/server/auth';
import { withAuth } from '@/server/auth/with-auth';
import { db } from '@/server/db';

const ambient = vi.hoisted(() => ({ headers: new Headers() }));

vi.mock('next/headers', () => ({
  headers: () => Promise.resolve(ambient.headers),
  cookies: () => Promise.resolve({ set: () => undefined, get: () => undefined, getAll: () => [] })
}));

const email = 'user@example.com';

function visitWith(cookie?: string) {
  ambient.headers = new Headers(cookie === undefined ? {} : { cookie });
}

function createRequest() {
  return new NextRequest('http://localhost:3000/api/resource');
}

async function signIn() {
  await auth.api.signUpEmail({ body: { name: 'Al', email, password: 'password1' } });
  const response = await auth.api.signInEmail({
    body: { email, password: 'password1' },
    asResponse: true
  });

  const cookies = response.headers.getSetCookie().map((cookie) => cookie.split(';', 1)[0] ?? '');

  return {
    sessionOnly: cookies
      .filter((cookie) => cookie.startsWith('better-auth.session_token='))
      .join('; '),
    browser: cookies.join('; ')
  };
}

async function getUserId() {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (user === undefined) {
    throw new Error('Expected the user to exist');
  }

  return user.id;
}

async function expireSession() {
  await db
    .update(sessions)
    .set({ expiresAt: new Date(Date.now() - 1000) })
    .where(eq(sessions.userId, await getUserId()));
}

async function revokeSession() {
  await db.delete(sessions).where(eq(sessions.userId, await getUserId()));
}

function createHandler() {
  return vi.fn((_request: NextRequest, _context: unknown, _session: unknown) =>
    NextResponse.json({ ok: true })
  );
}

describe('withAuth', () => {
  describe('without a valid session', () => {
    it.each([
      ['no cookie at all', undefined],
      ['a session cookie nobody issued', 'better-auth.session_token=abc'],
      ['a cookie that has nothing to do with the session', 'theme=dark']
    ])('answers 401 to a visitor with %s', async (_label, cookie) => {
      const handler = createHandler();
      visitWith(cookie);

      const response = await withAuth(handler)(createRequest(), {});

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ message: 'Unauthorized' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('answers 401 once the session has expired', async () => {
      const handler = createHandler();
      const { sessionOnly } = await signIn();
      await expireSession();
      visitWith(sessionOnly);

      const response = await withAuth(handler)(createRequest(), {});

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it('answers 401 once the session has been revoked', async () => {
      const handler = createHandler();
      const { sessionOnly } = await signIn();
      await revokeSession();
      visitWith(sessionOnly);

      const response = await withAuth(handler)(createRequest(), {});

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('with a valid session', () => {
    it('calls the handler once with the request, the context and the session', async () => {
      const handler = createHandler();
      const { sessionOnly } = await signIn();
      visitWith(sessionOnly);
      const request = createRequest();
      const context = { params: Promise.resolve({ id: '42' }) };

      await withAuth(handler)(request, context);

      expect(handler).toHaveBeenCalledOnce();
      const [calledRequest, calledContext, calledSession] = handler.mock.calls[0] ?? [];
      expect(calledRequest).toBe(request);
      expect(calledContext).toBe(context);
      expect(calledSession).toMatchObject({ user: { email, name: 'Al' } });
    });

    it('gives the handler the session of the visitor who is asking', async () => {
      const handler = createHandler();
      const { sessionOnly } = await signIn();
      visitWith(sessionOnly);

      await withAuth(handler)(createRequest(), {});

      const session = (handler.mock.calls[0] ?? [])[2];
      expect(session).toMatchObject({ user: { email } });
      expect(session).toHaveProperty('session.token');
      expect(session).toHaveProperty('user.id');
    });

    it('returns the response of the handler untouched', async () => {
      const { sessionOnly } = await signIn();
      visitWith(sessionOnly);
      const handler = vi.fn(() =>
        NextResponse.json({ created: true }, { status: 201, headers: { 'x-custom': 'yes' } })
      );

      const response = await withAuth(handler)(createRequest(), {});

      expect(response.status).toBe(201);
      expect(response.headers.get('x-custom')).toBe('yes');
      expect(await response.json()).toEqual({ created: true });
    });
  });

  describe('the handler', () => {
    it('can be asynchronous', async () => {
      const { sessionOnly } = await signIn();
      visitWith(sessionOnly);
      const handler = vi.fn(async () => {
        await Promise.resolve();
        return NextResponse.json({ async: true });
      });

      const response = await withAuth(handler)(createRequest(), {});

      expect(await response.json()).toEqual({ async: true });
    });

    it('lets an error rejected by an asynchronous handler through, instead of answering 401', async () => {
      const { sessionOnly } = await signIn();
      visitWith(sessionOnly);
      const failure = new Error('database is down');
      const handler = vi.fn(async () => {
        await Promise.resolve();
        throw failure;
      });

      await expect(withAuth(handler)(createRequest(), {})).rejects.toBe(failure);
    });

    it('lets an error thrown by the handler through, instead of answering 401', async () => {
      const { sessionOnly } = await signIn();
      visitWith(sessionOnly);
      const failure = new Error('database is down');
      const handler = vi.fn(() => {
        throw failure;
      });

      await expect(withAuth(handler)(createRequest(), {})).rejects.toBe(failure);
    });

    it('is not called when only the cookie that caches the session is sent', async () => {
      const handler = createHandler();
      const { browser } = await signIn();
      const cacheOnly = browser
        .split('; ')
        .filter((cookie) => cookie.startsWith('better-auth.session_data='))
        .join('; ');
      visitWith(cacheOnly);

      const response = await withAuth(handler)(createRequest(), {});

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // `session.cookieCache` in the Better Auth config lets a signed cookie vouch for the session for
  // 5 minutes without asking the database, so a revoked session is accepted until it runs out
  describe('known trade-off of the session cache', () => {
    it('still accepts a revoked session when the browser sends the cache cookie', async () => {
      const handler = createHandler();
      const { browser } = await signIn();
      await revokeSession();
      visitWith(browser);

      const response = await withAuth(handler)(createRequest(), {});

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalledOnce();
    });
  });
});

describe('GET /api/v1/test', () => {
  it('answers 401 to a visitor who is not signed in', async () => {
    visitWith();

    const response = await getProtectedRoute(createRequest(), {});

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: 'Unauthorized' });
  });

  it('answers 200 to a signed in visitor', async () => {
    const { sessionOnly } = await signIn();
    visitWith(sessionOnly);

    const response = await getProtectedRoute(createRequest(), {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'You are authed!' });
  });
});
