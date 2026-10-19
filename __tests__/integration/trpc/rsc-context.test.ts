import { describe, expect, it } from 'vitest';

import { createContext } from '@/server/trpc';

import { visitWith } from '../../setup/helpers/request';
import { signInAsTestUser, testUserEmail } from '../helpers/session';

describe('tRPC context of the server components', () => {
  it('carries the user of the visitor who is signed in', async () => {
    const { sessionOnly } = await signInAsTestUser();
    visitWith(sessionOnly);

    const context = await createContext();

    expect(context.user).toMatchObject({ email: testUserEmail });
  });

  it('carries no user for a visitor who is not signed in', async () => {
    visitWith();

    const context = await createContext();

    expect(context.user).toBeNull();
  });

  it('does not hand the user of a previous visitor to the next one', async () => {
    const { sessionOnly } = await signInAsTestUser();
    visitWith(sessionOnly);
    await createContext();
    visitWith();

    const context = await createContext();

    expect(context.user).toBeNull();
  });
});
