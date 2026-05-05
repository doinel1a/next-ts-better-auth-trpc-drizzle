import type { PropsWithChildren } from 'react';

import ThemeProvider from './client/theme';
import { TRPCProvider } from './client/trpc';

type TRootProvider = Readonly<PropsWithChildren>;

export default function RootProvider({ children }: TRootProvider) {
  return (
    <ThemeProvider>
      <TRPCProvider>{children}</TRPCProvider>
    </ThemeProvider>
  );
}
