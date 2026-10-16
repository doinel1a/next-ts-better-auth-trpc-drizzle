import db from '~/drizzle';

import random from './random';

async function main() {
  try {
    await random();
  } catch (error) {
    console.error('DB ERROR | Seeder:', error);
    process.exitCode = 1;
  } finally {
    await db.$client.end();
  }
}

await main();
