import { describe, expect, it } from 'vitest';

import { createCaller } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';
import { auth } from '@/server/auth';

import { signInAsTestUser } from '../helpers/session';

async function readSession(cookie: string) {
  return auth.api.getSession({ headers: new Headers({ cookie }) });
}

describe('tRPC context', () => {
  describe('when the caller already read the session', () => {
    it('lets a signed in visitor through even if the headers carry no cookie', async () => {
      const { sessionOnly } = await signInAsTestUser();
      const session = await readSession(sessionOnly);

      const api = createCaller(await createTRPCContext({ headers: new Headers(), session }));

      await expect(api.students.getFirst()).resolves.toBeNull();
    });

    it('keeps out a visitor found signed out even if the headers carry a valid cookie', async () => {
      const { sessionOnly } = await signInAsTestUser();

      const api = createCaller(
        await createTRPCContext({ headers: new Headers({ cookie: sessionOnly }), session: null })
      );

      await expect(api.students.getFirst()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
  });

  describe('when the caller did not read the session', () => {
    it('lets a visitor through when the headers carry a valid cookie', async () => {
      const { sessionOnly } = await signInAsTestUser();

      const api = createCaller(
        await createTRPCContext({ headers: new Headers({ cookie: sessionOnly }) })
      );

      await expect(api.students.getFirst()).resolves.toBeNull();
    });

    it('keeps out a visitor whose headers carry no cookie', async () => {
      const api = createCaller(await createTRPCContext({ headers: new Headers() }));

      await expect(api.students.getFirst()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
  });
});
