import { icons } from '@tabler/icons-react';

import { cn } from '@/lib/utils';

export type TTablerIconName = keyof typeof icons;

type TTablerIcon = {
  name: TTablerIconName;
  size?: number;
  className?: string;
};

export default function TablerIcon({
  name,
  size,
  className,
  ...otherProperties
}: Readonly<TTablerIcon>) {
  const Icon = icons[name];
  return (
    <Icon
      size={size}
      className={cn({ 'h-[1.2rem] w-[1.2rem]': !size }, className)}
      {...otherProperties}
    />
  );
}
