import { drizzle } from 'drizzle-orm/node-postgres';
import { reset } from 'drizzle-seed';

import { studentsSchema } from '~/drizzle/schemas/students';

import { env } from '@/env';

async function main() {
  const db = drizzle(env.DATABASE_URL);

  try {
    await reset(db, { studentsSchema });
  } catch (error) {
    console.error('DB ERROR | Reset seeder:', error);
  }
}

await main();
