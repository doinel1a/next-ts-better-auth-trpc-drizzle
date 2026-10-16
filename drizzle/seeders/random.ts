import { seed } from 'drizzle-seed';

import db from '~/drizzle';
import { studentsSchema } from '~/drizzle/schemas/students';

export default async function random() {
  await seed(db, { studentsSchema }, { count: 10 });
}
