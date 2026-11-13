import 'server-only';

import { cache } from 'react';

import { headers } from 'next/headers';

import { createCaller } from '../api/root';
import { createTRPCContext } from '../api/trpc';
import { getSession } from '../auth/server';

export const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set('x-trpc-source', 'rsc');

  return createTRPCContext({
    headers: heads,
    session: await getSession()
  });
});

export const trpc = createCaller(createContext);
