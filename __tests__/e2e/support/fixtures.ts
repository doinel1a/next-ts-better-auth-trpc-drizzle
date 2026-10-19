import { createHash, randomUUID } from 'node:crypto';

import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

type TNewUser = { name: string; email: string; password: string };

type TFixtures = {
  /**
    Address the app sees the browser coming from. Every test gets its own, so the rate limit of one
    test never counts the requests of another.
  */
  clientAddress: string;
  /**
    Credentials nobody has used yet, so tests running in parallel never share an account.
  */
  newUser: TNewUser;
};

export const test = base.extend<TFixtures>({
  clientAddress: async ({}, provide, testInfo) => {
    const digest = createHash('sha256')
      .update(`${testInfo.testId}:${testInfo.project.name}:${testInfo.retry}`)
      .digest();

    // Made-up addresses from the range reserved for tests
    await provide(`198.18.${digest[0]}.${((digest[1] ?? 0) % 254) + 1}`);
  },

  extraHTTPHeaders: async ({ clientAddress }, provide) => {
    await provide({ 'x-vercel-forwarded-for': clientAddress });
  },

  newUser: async ({}, provide) => {
    await provide({
      name: 'E2E User',
      email: `e2e-${randomUUID()}@e2e.test`,
      password: 'password1'
    });
  }
});
