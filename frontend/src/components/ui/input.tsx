import React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>
  & { suggestionsConfig?: unknown }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, suggestionsConfig: _suggestionsConfig, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-[hsl(var(--illustry-input-border))] bg-[hsl(var(--illustry-input-background))] px-3 py-2 text-[hsl(var(--illustry-input-foreground))]',
        'text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm',
        'file:font-medium placeholder:text-muted-foreground focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export default Input;
