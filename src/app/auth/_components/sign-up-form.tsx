'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import Button from '@/components/commons/button';
import Form from '@/components/ui/controlled-form';
import Input from '@/components/ui/controlled-form/input';
import { signUp } from '@/lib/auth/client';
import { route } from '@/lib/constants/routes';
import { searchParamsKey } from '@/lib/constants/shared';

import Container from './container';

type TSchema = z.infer<typeof schema>;
const schema = z
  .object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword']
      });
    }
  });

export default function SignUpForm() {
  const [isSigningUp, setIsSigningUp] = useState(false);

  const form = useForm<TSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const router = useRouter();
  const params = useSearchParams();
  const url = useMemo(() => {
    const redirectUrl = params.get(searchParamsKey.redirectUrl);
    return redirectUrl ?? route.signIn;
  }, [params]);

  const onSignUp = useCallback(
    async (values: TSchema) => {
      const { name, email, password } = values;
      await signUp.email(
        {
          name,
          email,
          password
        },
        {
          onRequest: () => {
            setIsSigningUp(true);
          },
          onResponse: () => {
            setIsSigningUp(false);
          },
          onSuccess: () => {
            toast.success('Sign up successful');
            router.replace(url);
          },
          onError: (ctx) => {
            console.error('CLIENT ERROR | Sign up:', ctx.error);
            toast.error(ctx.error.message);
          }
        }
      );
    },
    [router, url]
  );

  const onSubmit = useCallback(
    (values: TSchema) => {
      void onSignUp(values);
    },
    [onSignUp]
  );

  return (
    <Container mode='sign-up'>
      <Form form={form} onValidForm={onSubmit}>
        <Input
          control={form.control}
          name='name'
          label='Name'
          type='text'
          disabled={isSigningUp}
          isRequired
        />
        <Input
          control={form.control}
          name='email'
          label='Email'
          type='email'
          disabled={isSigningUp}
          isRequired
        />
        <Input
          control={form.control}
          name='password'
          label='Password'
          type='password'
          disabled={isSigningUp}
          isRequired
        />
        <Input
          control={form.control}
          name='confirmPassword'
          label='Confirm password'
          type='password'
          disabled={isSigningUp}
          isRequired
        />

        <Button type='submit' isLoading={isSigningUp}>
          Sign up
        </Button>
      </Form>
    </Container>
  );
}
