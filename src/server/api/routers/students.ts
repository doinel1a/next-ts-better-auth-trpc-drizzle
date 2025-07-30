import { z } from 'zod';

import { studentsSchema } from '~/drizzle/schemas/students';

import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

const input = z.object({
  name: z.string().min(1),
  age: z.number().min(1),
  email: z.email()
});

export const studentsRouter = createTRPCRouter({
  create: protectedProcedure.input(input).mutation(async ({ ctx, input }) => {
    return ctx.db.insert(studentsSchema).values({
      name: input.name,
      age: input.age,
      email: input.email
    });
  }),
  getFirst: protectedProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.query.studentsSchema.findFirst();
    return post ?? null;
  })
});
