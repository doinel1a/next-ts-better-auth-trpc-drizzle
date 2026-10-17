/* eslint-disable unicorn/no-top-level-side-effects */

import path from 'node:path';

import { defineConfig } from 'vitest/config';

const root = import.meta.dirname;

const alias = {
  '@': path.resolve(root, 'src'),
  '~': root,
  // `server-only` throws outside the RSC runtime, so tests get an empty module instead
  'server-only': path.resolve(root, '__tests__/setup/empty.ts')
};

const env = {
  NODE_ENV: 'test' as const,
  NEXT_PUBLIC_SIGN_UP_URL: '/auth/sign-up',
  NEXT_PUBLIC_SIGN_IN_URL: '/auth/sign-in',
  DATABASE_URL: 'postgresql://user:user_password@localhost:5432/db_test',
  BETTER_AUTH_URL: 'http://localhost:3000',
  BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-123'
};

export default defineConfig({
  resolve: { alias },
  test: {
    env,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/components/ui/**', 'src/**/*.d.ts']
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['__tests__/unit/**/*.test.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['__tests__/components/**/*.test.tsx'],
          setupFiles: ['__tests__/setup/components.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['__tests__/integration/**/*.test.ts'],
          setupFiles: ['__tests__/setup/integration.ts']
        }
      }
    ]
  }
});
