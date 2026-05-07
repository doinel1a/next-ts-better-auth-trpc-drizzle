'use client';

import { useSearchParams } from 'next/navigation';

import { searchParamsKey } from '@/lib/constants/routes';
import { buildAuthUrl, resolveRedirectUrl } from '@/lib/utils/auth-redirect';

export function useAuthRedirect(fallback: string) {
  const rawParam = useSearchParams().get(searchParamsKey.redirectUrl);

  return {
    redirectUrl: resolveRedirectUrl(rawParam, fallback),
    buildAuthUrl: (authRoute: string) => buildAuthUrl(authRoute, rawParam)
  };
}
