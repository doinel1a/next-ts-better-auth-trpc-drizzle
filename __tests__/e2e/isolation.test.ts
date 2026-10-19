import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';
import { Client } from 'pg';

import { e2eConfig, getDatabaseUrls } from './support/config';

async function hasUser(databaseUrl: string, email: string) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const result = await client.query('select 1 from users where email = $1', [email]);

    return result.rowCount === 1;
  } finally {
    await client.end();
  }
}

// If the app ever pointed at the development database, the tests would fill it with fake accounts
test('the app writes to the e2e database and leaves the development one alone', async ({
  request
}) => {
  const developmentUrl = process.env['DATABASE_URL'];
  if (developmentUrl === undefined) {
    throw new Error('DATABASE_URL is needed to look at the development database');
  }

  const email = `e2e-${randomUUID()}@e2e.test`;
  // a made-up address from the range reserved for tests, only to have a rate limit of its own
  // eslint-disable-next-line sonarjs/no-hardcoded-ip
  const clientAddress = '198.18.0.1';
  const response = await request.post('/api/auth/sign-up/email', {
    headers: { origin: e2eConfig.baseURL, 'x-vercel-forwarded-for': clientAddress },
    data: { name: 'Isolation', email, password: 'password1' }
  });
  expect(response.status()).toBe(200);

  expect(await hasUser(getDatabaseUrls().databaseUrl, email)).toBe(true);
  expect(await hasUser(developmentUrl, email)).toBe(false);
});
