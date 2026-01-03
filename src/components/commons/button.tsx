/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

import React from 'react';

import type { ButtonProperties } from '../ui/button';
import type { TTablerIconName } from './tabler';

import { cn } from '@/lib/utils';

import { Button as SCN_Button } from '../ui/button';
import TablerIcon from './tabler';

type TButton = ButtonProperties & {
  iconNameLeft?: TTablerIconName;
  iconNameRight?: TTablerIconName;
  isLoading?: boolean;
};

export default function Button({
  iconNameLeft,
  iconNameRight,
  isLoading,
  children,
  className,
  disabled,
  ...otherProperties
}: TButton) {
  return (
    <SCN_Button
      className={cn('w-full gap-x-1 font-semibold', className)}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      aria-disabled={isLoading || disabled}
      {...otherProperties}
    >
      {/* Always show the loader icon on the left, when in loading */}
      {isLoading && <Icon iconName='IconLoader' isLoading />}

      {/* Show the icon on the left, when not in loading */}
      {!isLoading && iconNameLeft && <Icon iconName={iconNameLeft} />}

      {children}

      {/* Show the icon on the right, when not in loading */}
      {!isLoading && iconNameRight && <Icon iconName={iconNameRight} />}
    </SCN_Button>
  );
}

type TIcon = {
  iconName: TTablerIconName;
  isLoading?: boolean;
};

function Icon({ iconName, isLoading }: Readonly<TIcon>) {
  return (
    <TablerIcon
      name={isLoading ? 'IconLoader' : iconName}
      className={cn('', { 'animate-spin': isLoading })}
      aria-hidden='true'
    />
  );
}
