'use client';

import React, { useState } from 'react';

import type { AppRouter } from '@/server/api/root';
import type { QueryClient } from '@tanstack/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { PropsWithChildren } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { httpBatchStreamLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import SuperJSON from 'superjson';

import { getAppBaseUrl } from '@/lib/utils/shared';
import { createQueryClient } from '@/server/query-client';

let clientQueryClientSingleton: QueryClient | undefined;
const getQueryClient = () => {
  if (typeof globalThis === 'undefined') {
    // server: always make a new query client
    return createQueryClient();
  }
  // browser: use singleton pattern to keep the same query client
  // eslint-disable-next-line sonarjs/no-nested-assignment
  return (clientQueryClientSingleton ??= createQueryClient());
};

export const api = createTRPCReact<AppRouter>();
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

type TTRPCProvider = PropsWithChildren;

export function TRPCProvider({ children }: Readonly<TTRPCProvider>) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error)
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getAppBaseUrl() + '/api/trpc',
          headers: () => {
            const headers = new Headers();
            headers.set('x-trpc-source', 'nextjs-react');
            return headers;
          }
        })
      ]
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </api.Provider>
    </QueryClientProvider>
  );
}
