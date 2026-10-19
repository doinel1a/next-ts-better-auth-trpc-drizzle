import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ThemeProvider from '@/components/providers/client/theme';
import ThemeToggle from '@/components/ui/theme-toggle';
import { storageKey } from '@/lib/constants/shared';

function stubSystemPreference(hasDarkPreference: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: hasDarkPreference && query.includes('dark'),
      media: query,
      // next-themes subscribes with the older addListener
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
  );
}

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

async function chooseTheme(name: 'Light' | 'Dark' | 'System') {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
  await user.click(await screen.findByRole('menuitem', { name }));
}

function hasThemeClass(theme: 'light' | 'dark') {
  return document.documentElement.classList.contains(theme);
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    stubSystemPreference(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('choosing a theme', () => {
    it('turns the light theme on', async () => {
      stubSystemPreference(true);
      renderToggle();

      await chooseTheme('Light');

      expect(hasThemeClass('light')).toBe(true);
      expect(hasThemeClass('dark')).toBe(false);
    });

    it('turns the dark theme on', async () => {
      renderToggle();

      await chooseTheme('Dark');

      expect(hasThemeClass('dark')).toBe(true);
      expect(hasThemeClass('light')).toBe(false);
    });

    it.each([
      { hasDarkPreference: true, expected: 'dark' },
      { hasDarkPreference: false, expected: 'light' }
    ] as const)(
      'follows the system when it prefers dark: $hasDarkPreference',
      async ({ hasDarkPreference, expected }) => {
        stubSystemPreference(hasDarkPreference);
        renderToggle();
        await chooseTheme(hasDarkPreference ? 'Light' : 'Dark');

        await chooseTheme('System');

        expect(hasThemeClass(expected)).toBe(true);
        expect(hasThemeClass(expected === 'dark' ? 'light' : 'dark')).toBe(false);
      }
    );
  });

  describe('remembering the choice', () => {
    it('stores the theme the user picked', async () => {
      renderToggle();

      await chooseTheme('Dark');

      expect(localStorage.getItem(storageKey.theme)).toBe('dark');
    });

    it('starts from the stored theme', () => {
      localStorage.setItem(storageKey.theme, 'dark');

      renderToggle();

      expect(hasThemeClass('dark')).toBe(true);
    });
  });
});
