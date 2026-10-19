import { isNotNull } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { rateLimits } from '~/drizzle/schemas/auth';

import { auth } from '@/server/auth';
import { db } from '@/server/db';

import {
  fromAddress,
  getSession,
  post,
  signIn,
  signUp,
  statusesOf,
  statusOf,
  testPassword
} from '../helpers/auth-http';
import { testUserEmail } from '../helpers/session';

vi.mock('next/headers', () => ({
  headers: () => Promise.resolve(new Headers()),
  cookies: () => Promise.resolve({ set: () => undefined, get: () => undefined, getAll: () => [] })
}));

const email = testUserEmail;
const password = testPassword;

describe('rate limiting of the auth routes', () => {
  describe('signing in: 5 attempts per minute', () => {
    it('lets 5 attempts through to be checked', async () => {
      const statuses = await statusesOf(5, () => signIn('203.0.113.7'));

      expect(statuses).toEqual([401, 401, 401, 401, 401]);
    });

    it('answers 429 from the 6th attempt on', async () => {
      const statuses = await statusesOf(7, () => signIn('203.0.113.7'));

      expect(statuses).toEqual([401, 401, 401, 401, 401, 429, 429]);
    });

    it('explains the 429 and says how long to wait', async () => {
      await statusesOf(5, () => signIn('203.0.113.7'));

      const response = await signIn('203.0.113.7');

      expect(response.status).toBe(429);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(response.headers.get('x-retry-after')).toBe('60');
      expect(await response.json()).toEqual({
        message: 'Too many requests. Please try again later.'
      });
    });

    it('does not even check the credentials once the limit is reached', async () => {
      await auth.api.signUpEmail({ body: { name: 'Al', email, password } });
      await statusesOf(5, () => signIn('203.0.113.7'));

      const response = await signIn('203.0.113.7', password);

      expect(response.status).toBe(429);
      expect(response.headers.getSetCookie()).toEqual([]);
    });

    it('lets the right password in while the limit is not reached', async () => {
      await auth.api.signUpEmail({ body: { name: 'Al', email, password } });
      await statusesOf(4, () => signIn('203.0.113.7'));

      const response = await signIn('203.0.113.7', password);

      expect(response.status).toBe(200);
    });
  });

  describe('signing up: 10 accounts per hour', () => {
    it('lets 10 sign ups through and refuses the 11th', async () => {
      const statuses: number[] = [];
      for (let index = 0; index < 11; index += 1) {
        statuses.push(await statusOf(signUp(index)));
      }

      expect(statuses).toEqual([200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 429]);
    });
  });

  describe('every other route: 60 requests per minute', () => {
    it('lets 60 requests through and refuses the 61st', async () => {
      const statuses = await statusesOf(61, () => getSession());

      expect(statuses.slice(0, 60)).toEqual(Array.from({ length: 60 }, () => 200));
      expect(statuses[60]).toBe(429);
    });
  });

  describe('who is counted', () => {
    it('keeps a separate count for every address', async () => {
      await statusesOf(6, () => signIn('203.0.113.7'));

      expect(await statusOf(signIn('203.0.113.7'))).toBe(429);
      expect(await statusOf(signIn('203.0.113.8'))).toBe(401);
    });

    it('keeps a separate count for every route', async () => {
      await statusesOf(6, () => signIn('203.0.113.7'));

      expect(await statusOf(signIn('203.0.113.7'))).toBe(429);
      expect(await statusOf(signUp(1))).toBe(200);
      expect(await statusOf(getSession())).toBe(200);
    });

    it('ignores a forged x-forwarded-for, so it cannot be used to start over', async () => {
      await statusesOf(5, () => signIn('203.0.113.7'));

      const forged = await post(
        '/sign-in/email',
        { email, password: 'wrong-password' },
        { ...fromAddress('203.0.113.7'), 'x-forwarded-for': '198.51.100.1' }
      );

      expect(forged.status).toBe(429);
    });

    it('counts an IPv4 address and its IPv6-mapped form together', async () => {
      await statusesOf(5, () => signIn('203.0.113.7'));

      // eslint-disable-next-line sonarjs/no-hardcoded-ip -- the IPv4-mapped IPv6 form is what is tested
      expect(await statusOf(signIn('::ffff:203.0.113.7'))).toBe(429);
    });

    it('counts the addresses of the same IPv6 /64 network together', async () => {
      await statusesOf(5, () => signIn('2001:db8:0:1::1'));

      expect(await statusOf(signIn('2001:db8:0:1::2'))).toBe(429);
      expect(await statusOf(signIn('2001:db8:0:2::1'))).toBe(401);
    });
  });

  // Where the address of the visitor cannot be trusted, every such visitor falls into one shared
  // count per route. The limit still applies, but to all of them at once: a few attempts from anyone
  // block everyone else. Outside production the shared count is the local address, in production it
  // is a "no trusted address" one, so this behaves the same way in both. Hosting that does not send
  // `x-vercel-forwarded-for` needs `advanced.ipAddress` to be adapted
  describe('without a trusted address (known trade-off)', () => {
    it('puts every visitor without the header in the same count', async () => {
      await statusesOf(5, () => signIn());

      expect(await statusOf(signIn())).toBe(429);
    });

    it.each([
      ['not an address', 'not-an-address'],
      ['a list of addresses', '203.0.113.7, 198.51.100.1'],
      ['an empty value', '']
    ])('puts a visitor who sends %s in that same count', async (_label, header) => {
      await statusesOf(5, () => signIn());

      expect(await statusOf(signIn(header))).toBe(429);
    });

    it('does not block a visitor who does have a trusted address', async () => {
      await statusesOf(6, () => signIn());

      expect(await statusOf(signIn('203.0.113.7'))).toBe(401);
    });
  });

  describe('the time window', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('lets the visitor try again after a minute', async () => {
      await statusesOf(6, () => signIn('203.0.113.7'));
      expect(await statusOf(signIn('203.0.113.7'))).toBe(429);

      vi.advanceTimersByTime(61_000);

      expect(await statusOf(signIn('203.0.113.7'))).toBe(401);
    });

    it('does not let the visitor try again before the minute is over', async () => {
      await statusesOf(5, () => signIn('203.0.113.7'));

      vi.advanceTimersByTime(59_000);

      expect(await statusOf(signIn('203.0.113.7'))).toBe(429);
    });

    it('says how much of the wait is left', async () => {
      await statusesOf(5, () => signIn('203.0.113.7'));
      vi.advanceTimersByTime(25_000);

      const response = await signIn('203.0.113.7');

      expect(response.headers.get('x-retry-after')).toBe('35');
    });

    it('does not lengthen the wait when the visitor keeps trying', async () => {
      await statusesOf(5, () => signIn('203.0.113.7'));
      vi.advanceTimersByTime(30_000);
      expect(await statusOf(signIn('203.0.113.7'))).toBe(429);

      vi.advanceTimersByTime(31_000);

      expect(await statusOf(signIn('203.0.113.7'))).toBe(401);
    });

    // The window starts from the last attempt that was let through, so attempts that are always
    // less than a minute apart never start over, however long they go on
    it('counts attempts that are spread out but never a minute apart', async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        expect(await statusOf(signIn('203.0.113.7'))).toBe(401);
        vi.advanceTimersByTime(50_000);
      }

      expect(await statusOf(signIn('203.0.113.7'))).toBe(429);
    });
  });

  describe('where the counts are kept', () => {
    it('forgets a block when the stored counts are cleared', async () => {
      await statusesOf(6, () => signIn('203.0.113.7'));
      expect(await statusOf(signIn('203.0.113.7'))).toBe(429);

      // every row of the table, on purpose: this is the whole rate limit state
      await db.delete(rateLimits).where(isNotNull(rateLimits.key));

      expect(await statusOf(signIn('203.0.113.7'))).toBe(401);
    });
  });
});
