import type { Page } from '@playwright/test';

/**
  A form submitted before React has hydrated it is sent by the browser itself and reloads the page,
  so the tests wait until the form is wired up.
*/
export async function openForm(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(() => {
    const form = document.querySelector('form');

    return form !== null && Object.keys(form).some((key) => key.startsWith('__reactProps'));
  });
}
