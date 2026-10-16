import {
  IconAt,
  IconDeviceLaptop,
  IconEye,
  IconEyeOff,
  IconLoader,
  IconMoonStars,
  IconSun,
  IconUser
} from '@tabler/icons-react';
import { cn } from 'cn';

const icons = {
  IconAt,
  IconDeviceLaptop,
  IconEye,
  IconEyeOff,
  IconLoader,
  IconMoonStars,
  IconSun,
  IconUser
} as const;

export type TTablerIconName = keyof typeof icons;

type TTablerIcon = Readonly<{
  name: TTablerIconName;
  size?: number;
  className?: string;
}>;

export default function TablerIcon({ name, size, className, ...otherProperties }: TTablerIcon) {
  const Icon = icons[name];
  return (
    <Icon
      size={size}
      className={cn({ 'h-[1.2rem] w-[1.2rem]': !size }, className)}
      {...otherProperties}
    />
  );
}
