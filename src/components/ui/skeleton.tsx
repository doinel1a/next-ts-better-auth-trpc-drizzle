import { cn } from 'cn';

function Skeleton({ className, ...properties }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='skeleton'
      className={cn('bg-muted animate-pulse rounded-md', className)}
      {...properties}
    />
  );
}

export { Skeleton };
