import React from 'react';
import { cn } from '@/lib/utils';

const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
      className={cn('animate-pulse rounded-[var(--illustry-button-radius)] bg-muted/70', className)}
      {...props}
    />
);

export default Skeleton;
