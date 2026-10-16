import 'server-only';

import { cache } from 'react';

import { headers } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

import { route, searchParamsKey } from '@/lib/constants/routes';
import { resolveRedirectUrl } from '@/lib/utils/auth-redirect';
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

type TSearchParams = Record<string, string | string[] | undefined>;

export async function redirectIfAuthenticated(searchParams: Promise<TSearchParams>) {
  const session = await getSession();
  if (!session) {
    return;
  }

  const params = await searchParams;
  const redirectUrl = params[searchParamsKey.redirectUrl];
  redirect(
    resolveRedirectUrl(typeof redirectUrl === 'string' ? redirectUrl : null, route.home),
    RedirectType.replace
  );
}
