import { beforeEach, vi } from 'vitest';

import { currentRequest, visitWith } from './helpers/request';

/**
  Server code reads the visitor's cookies from `headers()`, which only works inside a Next.js
  request. Tests set them with `visitWith`, and every test starts from a visitor without cookies.
*/
vi.mock('next/headers', () => ({
  headers: () => Promise.resolve(currentRequest.headers),
  cookies: () => Promise.resolve({ set: () => undefined, get: () => undefined, getAll: () => [] })
}));

beforeEach(() => {
  visitWith();
});

/**
  Replaces the app's pooled `db` with an in-memory PGlite instance running the real migrations, so
  integration tests exercise the actual schema without a Postgres server. Every test file gets its
  own isolated instance.
*/
vi.mock('@/server/db', async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');

  const authSchemas = await import('~/drizzle/schemas/auth');
  const { studentsSchema } = await import('~/drizzle/schemas/students');

  const client = new PGlite();
  const db = drizzle(client, { schema: { ...authSchemas, studentsSchema } });
  await migrate(db, { migrationsFolder: './drizzle/migrations' });

  return { db };
});

beforeEach(async () => {
  const { sql, is, getTableName } = await import('drizzle-orm');
  const { PgTable } = await import('drizzle-orm/pg-core');
  const { db } = await import('@/server/db');

  const authSchemas = await import('~/drizzle/schemas/auth');
  const { studentsSchema } = await import('~/drizzle/schemas/students');

  // Derived from the schemas so new tables are truncated without updating this list
  const tables = Object.values({ ...authSchemas, studentsSchema })
    .filter((value) => is(value, PgTable))
    .map((table) => sql.identifier(getTableName(table)));

  const tableList = sql.join(tables, sql.raw(', '));

  await db.execute(sql`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
});
