'use client';

import React from 'react';

import type { ComponentProps } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input as SCN_Input } from '@/components/ui/form/input';
import { cn } from '@/lib/utils';

import FormErrorMessage from './shared/error-message';
import FormLabel from './shared/label';

type TInput<TFormSchema extends FieldValues> = ComponentProps<'input'> & {
  control: Control<TFormSchema>;
  name: Path<TFormSchema>;
  label?: string;
  isRequired?: boolean;
};

export default function Input<TFormSchema extends FieldValues>({
  control,
  name,
  label,
  isRequired,
  className,
  disabled,
  ...otherProperties
}: TInput<TFormSchema>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('w-full', className)}>
          <FormLabel name={name} label={label} isRequired={isRequired} />
          <FormControl>
            <SCN_Input
              className='placeholder:italic'
              disabled={disabled}
              {...otherProperties}
              {...field}
            />
          </FormControl>
          <FormErrorMessage name={name} />
        </FormItem>
      )}
    />
  );
}
