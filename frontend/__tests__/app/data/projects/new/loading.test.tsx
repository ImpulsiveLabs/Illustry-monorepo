import { render, screen } from '@testing-library/react';
import NewProjectLoading from '@/app/(data)/projects/new/loading';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/ui/skeleton', () => ({
    __esModule: true,
    default: ({ className }: { className?: string }) => (
        <div data-testid="skeleton" className={className}>
            Skeleton
        </div>
    ),
}));

describe('NewProjectLoading', () => {
    it('renders loading container and skeletons', () => {
        render(<NewProjectLoading />);

        const container = screen.getAllByText('Skeleton')[0]
        expect(container).toBeInTheDocument();

        const skeletons = screen.getAllByTestId('skeleton');
        expect(skeletons).toHaveLength(2);

        expect(skeletons[0].className).toContain('h-4');
        expect(skeletons[0].className).toContain('w-32');
        expect(skeletons[1].className).toContain('h-6');
    });
});
