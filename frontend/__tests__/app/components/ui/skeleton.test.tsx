import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import Skeleton from '@/components/ui/skeleton';

describe('Skeleton', () => {
    it('renders default classes', () => {
        const { container } = render(<Skeleton data-testid="skeleton" />);
        const skeleton = container.firstChild as HTMLElement;

        expect(skeleton).toBeInTheDocument();
        expect(skeleton).toHaveClass('animate-pulse');
        expect(skeleton).toHaveClass('rounded-md');
    });

    it('applies custom className', () => {
        const { container } = render(<Skeleton className="h-4 w-8" />);
        expect(container.firstChild).toHaveClass('h-4');
        expect(container.firstChild).toHaveClass('w-8');
    });
});
