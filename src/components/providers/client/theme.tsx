'use client';

import type { ThemeProviderProps } from 'next-themes';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { storageKey } from '@/lib/constants/shared';

type TThemeProvider = Readonly<ThemeProviderProps>;

export default function ThemeProvider({ children, ...properties }: TThemeProvider) {
  return (
    <NextThemesProvider
      attribute='class'
      defaultTheme='system'
      storageKey={storageKey.theme}
      disableTransitionOnChange
      enableSystem
      {...properties}
    >
      {children}
    </NextThemesProvider>
  );
}
