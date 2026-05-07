import { searchParamsKey } from '@/lib/constants/routes';

import { getAppBaseUrl } from './shared';

export function isValidRedirectUrl(url: string | null): url is string {
  return url !== null && url !== '' && url.startsWith('/') && !url.startsWith('//');
}

export function resolveRedirectUrl(url: string | null, fallback: string) {
  return isValidRedirectUrl(url) ? url : fallback;
}

export function buildAuthUrl(authRoute: string, redirectUrl: string | null) {
  const url = new URL(authRoute, getAppBaseUrl());
  url.searchParams.set(searchParamsKey.redirectUrl, redirectUrl ?? '');
  return url;
}
