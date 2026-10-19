import 'server-only';

import { cache } from 'react';

import { headers } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

import { route, searchParamsKey } from '@/lib/constants/routes';
import { resolveRedirectUrl } from '@/lib/utils/auth-redirect';

import { auth } from '.';

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

type TSearchParams = Record<string, string | string[] | undefined>;

export async function redirectIfAuthenticated(searchParams: Promise<TSearchParams>) {
  const session = await getSession();
  if (!session) {
    return;
  }

  const params = await searchParams;
  const param = params[searchParamsKey.redirectUrl];
  const redirectUrl = Array.isArray(param) ? param[0] : param;

  redirect(
    resolveRedirectUrl(typeof redirectUrl === 'string' ? redirectUrl : null, route.home),
    RedirectType.replace
  );
}
