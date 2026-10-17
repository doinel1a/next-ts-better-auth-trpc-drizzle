import { searchParamsKey } from '@/lib/constants/routes';

const PLACEHOLDER_ORIGIN = 'https://redirect.invalid';

export function isValidRedirectUrl(url: string | null): url is string {
  if (url === null || url === '' || !url.startsWith('/') || url.includes('\\')) {
    return false;
  }

  try {
    const parsed = new URL(url, PLACEHOLDER_ORIGIN);
    return parsed.origin === PLACEHOLDER_ORIGIN && !parsed.pathname.startsWith('//');
  } catch {
    return false;
  }
}

export function resolveRedirectUrl(url: string | null, fallback: string) {
  if (!isValidRedirectUrl(url)) {
    return fallback;
  }

  const { pathname, search, hash } = new URL(url, PLACEHOLDER_ORIGIN);
  return pathname + search + hash;
}

export function buildAuthUrl(authRoute: string, redirectUrl = '') {
  if (redirectUrl === '') {
    return authRoute;
  }

  const searchParams = new URLSearchParams({ [searchParamsKey.redirectUrl]: redirectUrl });
  return `${authRoute}?${searchParams.toString()}`;
}
