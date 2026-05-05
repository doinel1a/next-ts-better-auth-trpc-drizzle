import type { PropsWithChildren } from 'react';

type TAuthLayout = Readonly<PropsWithChildren>;

export default function AuthLayout({ children }: TAuthLayout) {
  return <main className='flex h-full w-full items-center justify-center'>{children}</main>;
}
