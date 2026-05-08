import { drizzle } from 'drizzle-orm/node-postgres';
import postgres from 'pg';

import * as authSchema from '~/drizzle/schemas/auth';
import { studentsSchema } from '~/drizzle/schemas/students';

import { env } from '@/env';
import serverLogger from '@/lib/utils/logger/server';

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Pool | undefined;
};

const conn = globalForDb.conn ?? new postgres.Pool({ connectionString: env.DATABASE_URL });
conn.on('error', (error) => {
  serverLogger.error('Database connection error', error);
});

if (env.NODE_ENV !== 'production') {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, {
  schema: {
    ...authSchema,
    studentsSchema
  }
});
