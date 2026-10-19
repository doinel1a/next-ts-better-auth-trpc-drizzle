import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client, Pool } from 'pg';

import { e2eConfig, getDatabaseUrls } from './config';

const quotedName = `"${e2eConfig.databaseName}"`;

async function dropDatabase(adminUrl: string) {
  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  try {
    // FORCE closes the connections that the app server still has open
    await client.query(`DROP DATABASE IF EXISTS ${quotedName} WITH (FORCE)`);
  } finally {
    await client.end();
  }
}

async function createDatabase(adminUrl: string) {
  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  try {
    await client.query(`CREATE DATABASE ${quotedName}`);
  } finally {
    await client.end();
  }
}

async function migrateDatabase(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await migrate(drizzle(pool), { migrationsFolder: './drizzle/migrations' });
  } finally {
    await pool.end();
  }
}

const pagesToWarmUp = ['/', '/auth/sign-up', '/auth/sign-in', '/api/auth/ok'];

async function warmUpApp() {
  for (const path of pagesToWarmUp) {
    await fetch(new URL(path, e2eConfig.baseURL));
  }
}

/**
  Starts every run from an empty database with the real migrations applied, and drops it at the end.
  It is dropped first as well, in case a previous run was interrupted before it could clean up.
  Set `E2E_KEEP_DB=true` to keep the database after the run, to look at it when a test fails.
*/
export default async function globalSetup() {
  const { adminUrl, databaseUrl } = getDatabaseUrls();

  await dropDatabase(adminUrl);
  await createDatabase(adminUrl);
  await migrateDatabase(databaseUrl);
  await warmUpApp();

  return async () => {
    if (process.env['E2E_KEEP_DB'] === 'true') {
      return;
    }

    await dropDatabase(adminUrl);
  };
}
