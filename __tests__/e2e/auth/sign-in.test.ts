import type { Page } from '@playwright/test';

import { e2eConfig } from '../support/config';
import { expect, test } from '../support/fixtures';
import { openForm } from '../support/forms';

type TCredentials = { email: string; password: string };

const invalidCredentialsMessage = 'Invalid email or password.';
const maxFailedAttempts = 5;

async function fillAndSubmit(page: Page, credentials: TCredentials) {
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function signInThroughApi(page: Page, credentials: TCredentials) {
  return page.request.post('/api/auth/sign-in/email', {
    headers: { origin: e2eConfig.baseURL },
    data: credentials
  });
}

test.describe('Sign in', () => {
  test('a registered user signs in and lands on the home page', async ({
    page,
    registeredUser
  }) => {
    await openForm(page, '/auth/sign-in');

    await fillAndSubmit(page, registeredUser);

    await expect(page.getByText('Sign in successful')).toBeVisible();
    await expect(page).toHaveURL(`${e2eConfig.baseURL}/`);
    await expect(
      page.getByRole('heading', { name: `Welcome, ${registeredUser.name}!` })
    ).toBeVisible();
  });

  test('the user lands on the page they were heading to', async ({ page, registeredUser }) => {
    await openForm(page, '/auth/sign-in?redirect_url=%2Fsome%2Fpath%3Ftab%3D2');

    await fillAndSubmit(page, registeredUser);

    await expect(page).toHaveURL(`${e2eConfig.baseURL}/some/path?tab=2`);
  });

  for (const hostileUrl of ['https://evil.example/stolen', '//evil.example/stolen']) {
    test(`a redirect to ${hostileUrl} keeps the user on this site`, async ({
      page,
      registeredUser
    }) => {
      await openForm(page, `/auth/sign-in?redirect_url=${encodeURIComponent(hostileUrl)}`);

      await fillAndSubmit(page, registeredUser);

      await expect(page).toHaveURL(`${e2eConfig.baseURL}/`);
    });
  }

  test.describe('wrong credentials', () => {
    test.beforeEach(async ({ page }) => {
      await openForm(page, '/auth/sign-in');
    });

    test('a wrong password is refused with a neutral message', async ({ page, registeredUser }) => {
      await fillAndSubmit(page, { ...registeredUser, password: `${registeredUser.password}x` });

      await expect(page.getByText(invalidCredentialsMessage)).toBeVisible();
      await expect(page).toHaveURL(`${e2eConfig.baseURL}/auth/sign-in`);
    });

    test('an unknown email gets the same message as a wrong password', async ({
      page,
      newUser
    }) => {
      await fillAndSubmit(page, newUser);

      await expect(page.getByText(invalidCredentialsMessage)).toBeVisible();
      await expect(page).toHaveURL(`${e2eConfig.baseURL}/auth/sign-in`);
    });
  });

  test('a visitor sent to sign in from a protected page returns to it after signing in', async ({
    page,
    registeredUser
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(`${e2eConfig.baseURL}/auth/sign-in?redirect_url=%2F`);
    await openForm(page, page.url());

    await fillAndSubmit(page, registeredUser);

    await expect(page).toHaveURL(`${e2eConfig.baseURL}/`);
    await expect(
      page.getByRole('heading', { name: `Welcome, ${registeredUser.name}!` })
    ).toBeVisible();
  });

  for (const authPage of ['/auth/sign-in', '/auth/sign-up']) {
    test(`a user who is signed in is sent away from ${authPage}`, async ({
      page,
      registeredUser
    }) => {
      const response = await signInThroughApi(page, registeredUser);
      expect(response.status()).toBe(200);

      await page.goto(authPage);

      await expect(page).toHaveURL(`${e2eConfig.baseURL}/`);
    });
  }

  test('too many failed attempts are refused with a message to wait', async ({
    page,
    registeredUser
  }) => {
    const wrongCredentials = { ...registeredUser, password: `${registeredUser.password}x` };
    for (let attempt = 0; attempt < maxFailedAttempts; attempt += 1) {
      const response = await signInThroughApi(page, wrongCredentials);
      expect(response.status()).toBe(401);
    }

    await openForm(page, '/auth/sign-in');
    await fillAndSubmit(page, registeredUser);

    await expect(
      page.getByText('Too many attempts. Please wait a moment and try again.')
    ).toBeVisible();
    await expect(page).toHaveURL(`${e2eConfig.baseURL}/auth/sign-in`);
  });

  test.describe('invalid form', () => {
    let signInRequests: string[];

    test.beforeEach(async ({ page }) => {
      signInRequests = [];
      page.on('request', (sent) => {
        if (sent.url().includes('/api/auth/sign-in')) {
          signInRequests.push(sent.url());
        }
      });

      await openForm(page, '/auth/sign-in');
    });

    test('an email that is not an email is rejected before anything is sent', async ({
      page,
      registeredUser
    }) => {
      await fillAndSubmit(page, { ...registeredUser, email: 'not-an-email' });

      // the browser stops an address that is not an email before the form's own validation runs
      await expect(page.locator('input[type=email]:invalid')).toHaveCount(1);
      expect(signInRequests).toEqual([]);
    });

    test('an empty password is rejected before anything is sent', async ({
      page,
      registeredUser
    }) => {
      await fillAndSubmit(page, { ...registeredUser, password: '' });

      await expect(page.getByTestId('password-error-message')).toBeVisible();
      expect(signInRequests).toEqual([]);
    });
  });
});
