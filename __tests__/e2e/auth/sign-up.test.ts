import type { Page } from '@playwright/test';

import { e2eConfig } from '../support/config';
import { expect, test } from '../support/fixtures';
import { openForm } from '../support/forms';

type TCredentials = { name: string; email: string; password: string; confirmPassword?: string };

const successMessage = 'Request received. You can now sign in.';

async function fillAndSubmit(page: Page, credentials: TCredentials) {
  await page.getByLabel('Name').fill(credentials.name);
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page
    .getByLabel('Confirm password')
    .fill(credentials.confirmPassword ?? credentials.password);
  await page.getByRole('button', { name: 'Sign up' }).click();
}

test.describe('Sign up', () => {
  test('a new user signs up and lands on the sign-in page', async ({ page, newUser }) => {
    await openForm(page, '/auth/sign-up');

    await fillAndSubmit(page, newUser);

    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await expect(page.getByText(successMessage)).toBeVisible();
  });

  test('the page the user was heading to survives the sign-up', async ({ page, newUser }) => {
    await openForm(page, '/auth/sign-up?redirect_url=%2Fdashboard');

    await fillAndSubmit(page, newUser);

    await expect(page).toHaveURL(/\/auth\/sign-in\?redirect_url=%2Fdashboard$/);
  });

  test('an email that is already registered gets the same answer as a new one', async ({
    page,
    request,
    newUser
  }) => {
    const seeded = await request.post('/api/auth/sign-up/email', {
      headers: { origin: e2eConfig.baseURL },
      data: newUser
    });
    expect(seeded.status()).toBe(200);

    await openForm(page, '/auth/sign-up');
    await fillAndSubmit(page, newUser);

    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await expect(page.getByText(successMessage)).toBeVisible();
    await expect(page.getByText(/already|exists|taken/i)).toHaveCount(0);
  });

  test.describe('invalid form', () => {
    let signUpRequests: string[];

    test.beforeEach(async ({ page }) => {
      signUpRequests = [];
      page.on('request', (sent) => {
        if (sent.url().includes('/api/auth/sign-up')) {
          signUpRequests.push(sent.url());
        }
      });

      await openForm(page, '/auth/sign-up');
    });

    test('passwords that do not match are rejected before anything is sent', async ({
      page,
      newUser
    }) => {
      await fillAndSubmit(page, { ...newUser, confirmPassword: `${newUser.password}x` });

      await expect(page.getByTestId('confirmPassword-error-message')).toHaveText(
        'Passwords do not match'
      );
      await expect(page).toHaveURL(/\/auth\/sign-up$/);
      expect(signUpRequests).toEqual([]);
    });

    test('a password that is too short is rejected before anything is sent', async ({
      page,
      newUser
    }) => {
      await fillAndSubmit(page, { ...newUser, password: 'short', confirmPassword: 'short' });

      await expect(page.getByTestId('password-error-message')).toBeVisible();
      await expect(page).toHaveURL(/\/auth\/sign-up$/);
      expect(signUpRequests).toEqual([]);
    });
  });
});
