import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Toaster from '@/components/ui/toaster';

const { toasterSpy } = vi.hoisted(() => ({
    toasterSpy: vi.fn((props: any) => <div data-testid="rad-toaster" data-props={JSON.stringify(props)} />)
}));

vi.mock('sonner', () => ({
    Toaster: toasterSpy
}));

describe('Toaster', () => {
    it('renders sonner toaster with expected props', () => {
        render(<Toaster />);

        expect(screen.getByTestId('rad-toaster')).toBeInTheDocument();
        expect(toasterSpy).toHaveBeenCalledTimes(1);
        const renderedProps = screen.getByTestId('rad-toaster').getAttribute('data-props') || '';
        expect(renderedProps).toContain('bottom-right');
        expect(renderedProps).toContain('--background');
        expect(renderedProps).toContain('--foreground');
        expect(renderedProps).toContain('--border');
    });
});
