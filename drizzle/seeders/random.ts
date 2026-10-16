import { seed } from 'drizzle-seed';

import db from '~/drizzle';
import { studentsSchema } from '~/drizzle/schemas/students';

export default async function random() {
  try {
    await seed(db, { studentsSchema }, { count: 10 });
  } catch (error) {
    console.error('DB ERROR | Random seeder:', error);
  }
}
