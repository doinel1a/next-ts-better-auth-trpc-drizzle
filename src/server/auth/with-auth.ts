import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { getSession } from './server';

type TSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

type THandler<TContext> = (
  request: NextRequest,
  context: TContext,
  session: TSession
) => Promise<Response> | Response;

/**
  Protects a route handler: answers `401` when there is no valid session, otherwise calls the
  handler with the session as third argument.
  `/api` is excluded from the proxy matcher, so route handlers under it must use this (or check the
  session themselves).

  @example
  export const GET = withAuth(async (_request, _context, session) => {
    return NextResponse.json({ userId: session.user.id });
  });
*/
export function withAuth<TContext = unknown>(handler: THandler<TContext>) {
  return async (request: NextRequest, context: TContext) => {
    const session = await getSession();

    return session
      ? handler(request, context, session)
      : NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  };
}
