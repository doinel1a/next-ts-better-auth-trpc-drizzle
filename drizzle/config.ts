import { defineConfig } from 'drizzle-kit';

import { env } from '@/env';

export default defineConfig({
  out: './drizzle/migrations',
  schema: './drizzle/schemas/*.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL
  }
});
