import { drizzle } from 'drizzle-orm/node-postgres';
import { reset } from 'drizzle-seed';
import { usersSchema } from 'drizzle/schemas/users';

import { env } from '@/env';

async function main() {
  const db = drizzle(env.DATABASE_URL);

  try {
    await reset(db, { usersSchema });
  } catch (error) {
    console.error('DB ERROR | Reset seeder:', error);
  }
}

await main();
