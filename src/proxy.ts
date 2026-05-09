import type { NextRequest } from 'next/server';

import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse } from 'next/server';

import { route, searchParamsKey } from '@/lib/constants/routes';
import { isValidRedirectUrl } from '@/lib/utils/auth-redirect';

const publicRoutes = new Set([route.signUp, route.signIn]);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.has(pathname);

  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = sessionCookie != null;

  if (isPublicRoute) {
    if (isAuthenticated && (pathname === route.signUp || pathname === route.signIn)) {
      const redirectUrl = request.nextUrl.searchParams.get(searchParamsKey.redirectUrl);
      if (isValidRedirectUrl(redirectUrl)) {
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }

      return NextResponse.redirect(new URL(route.home, request.url));
    }

    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const signInUrl = new URL(route.signIn, request.url);
    signInUrl.searchParams.set(
      searchParamsKey.redirectUrl,
      request.nextUrl.pathname + request.nextUrl.search
    );

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
