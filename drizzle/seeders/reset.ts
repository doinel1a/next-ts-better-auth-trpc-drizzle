import { reset } from 'drizzle-seed';

import db from '~/drizzle';
import { studentsSchema } from '~/drizzle/schemas/students';

async function main() {
  try {
    await reset(db, { studentsSchema });
  } catch (error) {
    console.error('DB ERROR | Reset seeder:', error);
    process.exitCode = 1;
  } finally {
    await db.$client.end();
  }
}

await main();
