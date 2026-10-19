import 'server-only';

import { cache } from 'react';

import type { AppRouter } from '../api/root';

import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { headers } from 'next/headers';

import { createCaller } from '../api/root';
import { createTRPCContext } from '../api/trpc';
import { getSession } from '../auth/server';
import { createQueryClient } from './query-client';

export const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set('x-trpc-source', 'rsc');

  return createTRPCContext({
    headers: heads,
    session: await getSession()
  });
});

const getQueryClient = cache(createQueryClient);
const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient
);
