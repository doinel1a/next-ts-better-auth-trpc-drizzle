'use client';

import * as React from 'react';

import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import TablerIcon from '../commons/tabler';

export default function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button data-testid='theme-toggle' variant='outline' size='icon'>
          <TablerIcon
            name='IconSun'
            className='h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90'
          />

          <TablerIcon
            name='IconMoonStars'
            className='absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0'
          />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-testid='theme-dropdown-content' align='end'>
        <DropdownMenuItem
          data-testid='theme-light'
          onClick={() => {
            setTheme('light');
          }}
        >
          <TablerIcon name='IconSun' className='mr-2 h-[1.2rem] w-[1.2rem]' />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid='theme-dark'
          onClick={() => {
            setTheme('dark');
          }}
        >
          <TablerIcon name='IconMoonStars' className='mr-2 h-[1.2rem] w-[1.2rem]' />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid='theme-system'
          onClick={() => {
            setTheme('system');
          }}
        >
          <TablerIcon name='IconDeviceLaptop' className='mr-2 h-[1.2rem] w-[1.2rem]' />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
