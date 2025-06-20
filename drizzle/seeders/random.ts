import { drizzle } from 'drizzle-orm/node-postgres';
import { seed } from 'drizzle-seed';
import { usersSchema } from 'drizzle/schemas/users';

import { env } from '@/env';

export default async function random() {
  const db = drizzle(env.DATABASE_URL);

  try {
    await seed(db, { usersSchema }, { count: 10 });
  } catch (error) {
    console.error('DB ERROR | Random seeder:', error);
  }
}
