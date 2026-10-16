import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '@/env';

/**
  Standalone client for scripts run outside Next.js. The app must use the pooled `db` from
  `src/server/db.ts` instead, to avoid opening a second connection pool.
*/
const pool = new Pool({
  connectionString: env.DATABASE_URL
});

const db = drizzle({ client: pool });

export default db;
