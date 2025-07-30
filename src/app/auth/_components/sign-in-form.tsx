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
import { signIn } from '@/lib/auth/client';
import { route } from '@/lib/constants/routes';
import { searchParamsKey } from '@/lib/constants/shared';

import Container from './container';

type TSchema = z.infer<typeof schema>;
const schema = z.object({
  email: z.email(),
  password: z.string().min(8)
});

export default function SignInForm() {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const form = useForm<TSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const router = useRouter();
  const params = useSearchParams();
  const url = useMemo(() => {
    const redirectUrl = params.get(searchParamsKey.redirectUrl);
    return redirectUrl ?? route.home;
  }, [params]);

  const onSignIn = useCallback(
    async (values: TSchema) => {
      const { email, password } = values;
      await signIn.email(
        {
          email,
          password
        },
        {
          onRequest: () => {
            setIsSigningIn(true);
          },
          onResponse: () => {
            setIsSigningIn(false);
          },
          onSuccess: () => {
            toast.success('Sign in successful');
            router.replace(url);
          },
          onError: (ctx) => {
            console.error('CLIENT ERROR | Sign in:', ctx.error);
            toast.error(ctx.error.message);
          }
        }
      );
    },
    [router, url]
  );

  const onSubmit = useCallback(
    (values: TSchema) => {
      void onSignIn(values);
    },
    [onSignIn]
  );

  return (
    <Container mode='sign-in'>
      <Form form={form} onValidForm={onSubmit}>
        <Input
          control={form.control}
          name='email'
          label='Email'
          type='email'
          disabled={isSigningIn}
          isRequired
        />
        <Input
          control={form.control}
          name='password'
          label='Password'
          type='password'
          disabled={isSigningIn}
          isRequired
        />

        <Button type='submit' isLoading={isSigningIn}>
          Sign in
        </Button>
      </Form>
    </Container>
  );
}
