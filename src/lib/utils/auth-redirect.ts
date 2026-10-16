import { searchParamsKey } from '@/lib/constants/routes';

import { getAppBaseUrl } from './shared';

const PLACEHOLDER_ORIGIN = 'https://redirect.invalid';

export function isValidRedirectUrl(url: string | null): url is string {
  if (url === null || url === '' || !url.startsWith('/') || url.includes('\\')) {
    return false;
  }

  try {
    return new URL(url, PLACEHOLDER_ORIGIN).origin === PLACEHOLDER_ORIGIN;
  } catch {
    return false;
  }
}

export function resolveRedirectUrl(url: string | null, fallback: string) {
  return isValidRedirectUrl(url) ? url : fallback;
}

export function buildAuthUrl(authRoute: string, redirectUrl = '') {
  const url = new URL(authRoute, getAppBaseUrl());
  url.searchParams.set(searchParamsKey.redirectUrl, redirectUrl);
  return url;
}
