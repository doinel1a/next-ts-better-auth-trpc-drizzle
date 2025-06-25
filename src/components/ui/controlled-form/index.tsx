'use client';

import React from 'react';

import type { ComponentProps } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { Form as SCN_Form } from '@/components/ui/form';
import { cn } from '@/lib/utils';

type TForm<TFormSchema extends FieldValues> = ComponentProps<'form'> & {
  form: UseFormReturn<TFormSchema>;
  onValidForm?: (values: TFormSchema) => void;
  onInvalidForm?: () => void;
};

export default function Form<TFormSchema extends FieldValues>({
  form,
  children,
  className,
  onValidForm,
  onInvalidForm,
  ...otherProperties
}: TForm<TFormSchema>) {
  const { handleSubmit } = form;

  return (
    <SCN_Form {...form}>
      <form
        onSubmit={onValidForm ? handleSubmit(onValidForm, onInvalidForm) : undefined}
        className={cn('flex flex-col space-y-5', className)}
        {...otherProperties}
      >
        {children}
      </form>
    </SCN_Form>
  );
}
