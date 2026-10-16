/* eslint-disable sonarjs/pseudo-random */

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import z, { ZodError } from 'zod';

import { env } from '@/env';
import serverLogger from '@/lib/utils/logger/server';
import { auth } from '@/server/auth';

import { db } from '../db';

export const createTRPCContext = async (options: { headers: Headers }) => {
  const data = await auth.api.getSession({ headers: options.headers });

  return {
    db,
    session: data?.session ?? null,
    user: data?.user ?? null,
    ...options
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? z.treeifyError(error.cause) : null
      }
    };
  }
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

/**
  Middleware for timing procedure execution and adding an artificial delay in development.
*/
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (env.NODE_ENV === 'development') {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  serverLogger.info(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);
export const protectedProcedure = t.procedure.use(timingMiddleware).use(({ ctx, next }) => {
  if (ctx.session === null || ctx.user === null) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user
    }
  });
});
