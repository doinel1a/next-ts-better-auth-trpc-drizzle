import type { NextRequest } from 'next/server';

import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse } from 'next/server';

import { route, searchParamsKey } from '@/lib/constants/routes';

const publicRoutes = new Set([route.signUp, route.signIn]);

export function proxy(request: NextRequest) {
  const isPublicRoute = publicRoutes.has(request.nextUrl.pathname);
  if (isPublicRoute) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (sessionCookie == null) {
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
  /**
    Skips Next.js internals, API routes (protected by `withAuth` / tRPC) and any path with a file
    extension, i.e. static assets served from `public/` (logo.png, favicon.svg, robots.txt, ...).
  */
  matcher: ['/((?!_next/|api(?:/|$)|.*\\.[^/]+$).*)']
};
