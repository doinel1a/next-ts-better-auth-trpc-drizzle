'use client';

import { useSearchParams } from 'next/navigation';

import { searchParamsKey } from '@/lib/constants/routes';
import { buildAuthUrl, isValidRedirectUrl, resolveRedirectUrl } from '@/lib/utils/auth-redirect';

export function useAuthRedirect(fallback: string) {
  const rawParam = useSearchParams().get(searchParamsKey.redirectUrl);
  const trustedParam = isValidRedirectUrl(rawParam) ? rawParam : undefined;

  return {
    redirectUrl: resolveRedirectUrl(rawParam, fallback),
    buildAuthUrl: (authRoute: string) => buildAuthUrl(authRoute, trustedParam)
  };
}
