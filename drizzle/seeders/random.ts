import { drizzle } from 'drizzle-orm/node-postgres';
import { seed } from 'drizzle-seed';

import { studentsSchema } from '~/drizzle/schemas/students';

import { env } from '@/env';

export default async function random() {
  const db = drizzle(env.DATABASE_URL);

  try {
    await seed(db, { studentsSchema }, { count: 10 });
  } catch (error) {
    console.error('DB ERROR | Random seeder:', error);
  }
}
