import { render, screen } from '@testing-library/react';
import NewVisualizationLoading from '@/app/(data)/visualizations/new/loading';
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

describe('NewVisualizationLoading', () => {
    it('renders loading container and skeletons', () => {
        render(<NewVisualizationLoading />);

        const container = screen.getAllByText('Skeleton')[0]
        expect(container).toBeInTheDocument();

        const skeletons = screen.getAllByTestId('skeleton');
        expect(skeletons).toHaveLength(2);

        expect(skeletons[0].className).toContain('h-4');
        expect(skeletons[0].className).toContain('w-32');
        expect(skeletons[1].className).toContain('h-6');
    });
});
