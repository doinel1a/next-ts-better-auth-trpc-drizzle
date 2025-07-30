import { studentsRouter } from './routers/students';
import { createCallerFactory, createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  students: studentsRouter
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
