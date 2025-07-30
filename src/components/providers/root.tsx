import React from 'react';

import type { PropsWithChildren } from 'react';

import ThemeProvider from './client/theme';
import { TRPCProvider } from './client/trpc';

type TRootProvider = PropsWithChildren;

export default function RootProvider({ children }: Readonly<TRootProvider>) {
  return (
    <ThemeProvider>
      <TRPCProvider>{children}</TRPCProvider>
    </ThemeProvider>
  );
}
