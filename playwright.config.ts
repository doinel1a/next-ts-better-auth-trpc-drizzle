/* eslint-disable unicorn/no-top-level-side-effects */

import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

import { e2eConfig, getDatabaseUrls } from './__tests__/e2e/support/config';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const isCI = process.env['CI'] !== undefined;

/**
  See https://playwright.dev/docs/test-configuration.
*/
export default defineConfig({
  testDir: '__tests__/e2e',
  /*
    Maximum time one test can run for.
  */
  timeout: 30 * 1000,
  expect: {
    /**
      Maximum time expect() should wait for the condition to be met.
      For example in `await expect(locator).toHaveText();`
    */
    timeout: 5000
  },
  /*
    Run tests in files in parallel
  */
  fullyParallel: true,
  /*
    Fail the build on CI if you accidentally left test.only in the source code.
  */
  forbidOnly: isCI,
  /*
    Retry on CI only
  */
  retries: isCI ? 2 : 0,
  /*
    Opt out of parallel tests on CI.
  */
  workers: isCI ? 1 : undefined,
  /*
    Reporter to use. See https://playwright.dev/docs/test-reporters
  */
  reporter: 'html',
  /*
    Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  */
  use: {
    /*
      Maximum time each action such as `click()` can take. Defaults to 0 (no limit).
    */
    actionTimeout: 0,
    /*
      Base URL to use in actions like `await page.goto('/')`.
    */
    baseURL: e2eConfig.baseURL,

    /*
      Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    */
    trace: 'on-first-retry'
  },

  /*
    Configure projects for major browsers
  */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }

    /*
      Test against mobile viewports.
    */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /*
      Test against branded browsers.
    */
    // {
    //   name: 'Microsoft Edge',
    //   use: { channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { channel: 'chrome' },
    // },
  ],

  /*
    Folder for test artifacts such as screenshots, videos, traces, etc.
  */
  outputDir: '__tests_results__',

  /*
    Creates the database of the e2e tests before the run and drops it at the end
  */
  globalSetup: './__tests__/e2e/support/global-setup.ts',

  /*
    The e2e tests start their own copy of the app, on a port and a database of their own
  */
  webServer: {
    // CI tests the production build (`pnpm build` runs in the workflow), locally the dev server
    command: isCI ? 'pnpm preview' : 'pnpm dev',
    port: e2eConfig.port,
    // A server that is already running is wired to the development database, so it is never reused
    reuseExistingServer: false,
    // The development server compiles each page the first time it is opened
    timeout: 120 * 1000,
    env: {
      PORT: String(e2eConfig.port),
      NODE_ENV: isCI ? 'production' : 'development',
      // Better Auth only accepts requests that come from this address
      BETTER_AUTH_URL: e2eConfig.baseURL,
      DATABASE_URL: getDatabaseUrls().databaseUrl
    }
  }
});
