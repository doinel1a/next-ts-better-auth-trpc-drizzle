import { drizzle } from 'drizzle-orm/node-postgres';
import postgres from 'pg';

import * as authSchema from '~/drizzle/schemas/auth';
import { studentsSchema } from '~/drizzle/schemas/students';

import { env } from '@/env';

/**
  Cache the database connection in development. This avoids creating a new connection on every HMR
  update.
*/
const globalForDb = globalThis as unknown as {
  conn: postgres.Pool | undefined;
};

function createPool() {
  const pool = new postgres.Pool({ connectionString: env.DATABASE_URL });
  pool.on('error', (connectionError) => {
    console.error('SERVER ERROR | Idle database client error', {
      code: 'code' in connectionError ? connectionError.code : undefined,
      message: connectionError.message
    });
  });

  return pool;
}

const conn = globalForDb.conn ?? createPool();

if (env.NODE_ENV !== 'production') {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, {
  schema: {
    ...authSchema,
    studentsSchema
  }
});
