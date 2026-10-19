import type { Page } from '@playwright/test';

import { e2eConfig } from '../support/config';
import { expect, test } from '../support/fixtures';
import { openForm } from '../support/forms';

async function openUserMenu(page: Page) {
  await page.getByRole('button', { name: 'User menu' }).click();
}

test.describe('Session', () => {
  test('signing out ends the session', async ({ page, signedInUser }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: `Welcome, ${signedInUser.name}!` })
    ).toBeVisible();

    await openUserMenu(page);
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    await expect(page.getByText('Sign out successful')).toBeVisible();
    // the page refreshes itself and, with no session left, sends the user to sign in
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    await page.goto('/');
    await expect(page).toHaveURL(`${e2eConfig.baseURL}/auth/sign-in?redirect_url=%2F`);
    const session = await page.request.get('/api/auth/get-session');
    expect(await session.json()).toBeNull();
  });

  test('the session survives a reload of the page', async ({ page, signedInUser }) => {
    await page.goto('/');

    await page.reload();

    await expect(
      page.getByRole('heading', { name: `Welcome, ${signedInUser.name}!` })
    ).toBeVisible();
  });

  test('a session cookie that is no longer valid does not open the home page', async ({
    page,
    context
  }) => {
    // The proxy only looks for the cookie, so the page itself has to refuse a session it cannot find
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: 'expired.session',
        url: e2eConfig.baseURL
      }
    ]);

    await page.goto('/');

    await expect(page).toHaveURL(`${e2eConfig.baseURL}/auth/sign-in`);
  });

  test.describe('user menu', () => {
    test('offers to sign in when nobody is signed in', async ({ page }) => {
      await openForm(page, '/auth/sign-in');

      await openUserMenu(page);

      await expect(page.getByRole('menuitem', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Sign out' })).toHaveCount(0);
    });

    test('offers to sign out once the user has signed in, without reloading', async ({
      page,
      registeredUser
    }) => {
      await openForm(page, '/auth/sign-in');
      await page.getByLabel('Email').fill(registeredUser.email);
      await page.getByLabel('Password', { exact: true }).fill(registeredUser.password);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(`${e2eConfig.baseURL}/`);

      await openUserMenu(page);

      await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: 'Sign in' })).toHaveCount(0);
    });
  });
});
