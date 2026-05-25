import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import React from 'react';
import { cn } from '@/lib/utils';
import Icons from '../icons';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-[0.35rem] border border-input bg-background/80 text-primary-foreground shadow-sm ring-offset-background transition-[border-color,box-shadow,background-color] duration-200 focus-visible:outline-none',
      'focus-visible:border-[hsl(var(--ring)/0.6)] focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0 disabled:cursor-not-allowed',
      'disabled:bg-muted/55 disabled:opacity-70 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn('flex items-center justify-center text-current')}
    >
      <Icons.check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export default Checkbox;
