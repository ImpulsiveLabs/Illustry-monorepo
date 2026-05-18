import React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>
  & { suggestionsConfig?: unknown }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, suggestionsConfig: _suggestionsConfig, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-[var(--illustry-button-radius)] border border-[hsl(var(--illustry-input-border)/0.78)] bg-[hsl(var(--illustry-input-background)/0.78)] px-3 py-2 text-[hsl(var(--illustry-input-foreground))] shadow-[0_1px_0_hsl(var(--border)/0.35)] backdrop-blur',
        'text-sm transition-[border-color,box-shadow,background-color] duration-200 ring-offset-background file:border-0 file:bg-transparent file:text-sm',
        'file:font-medium placeholder:text-muted-foreground focus-visible:outline-none',
        'focus-visible:border-[hsl(var(--ring)/0.6)] focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0',
        'aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-destructive/10',
        'disabled:cursor-not-allowed disabled:bg-muted/55 disabled:text-muted-foreground disabled:opacity-100',
        'read-only:bg-muted/35 read-only:text-muted-foreground',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export default Input;
