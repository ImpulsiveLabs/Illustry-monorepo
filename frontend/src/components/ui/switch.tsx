import * as SwitchPrimitives from '@radix-ui/react-switch';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitives.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-input bg-input/70 p-0.5 shadow-inner transition-[border-color,box-shadow,background-color] duration-200 focus-visible:outline-none',
      'focus-visible:border-[hsl(var(--ring)/0.6)] focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0',
      'disabled:cursor-not-allowed disabled:opacity-60 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-md ring-0 transition-transform',
        'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export default Switch;
