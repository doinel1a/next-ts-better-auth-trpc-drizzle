import type { NextRequest } from 'next/server';

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { env } from '@/env';
import { serverLogger } from '@/lib/utils/logger/server';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (request: NextRequest) => {
  return createTRPCContext({
    headers: request.headers
  });
};

const handler = (request: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => createContext(request),
    onError: ({ path, error }) => {
      const label = `tRPC failed on ${path ?? '<no-path>'}`;
      if (env.NODE_ENV === 'development') {
        serverLogger.error(label, error);
      } else {
        serverLogger.error(label, { code: error.code, message: error.message });
      }
    }
  });

export { handler as GET, handler as POST };
