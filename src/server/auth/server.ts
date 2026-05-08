import 'server-only';

import { cache } from 'react';

import { headers } from 'next/headers';

import { serverLogger } from '@/lib/utils/logger/server';

import { auth } from '.';

export const getSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    serverLogger.error('Cannot get session', error);
    return null;
  }
});
