import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorCard from '@/components/ui/error-card';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/link', () => ({
    default: ({ children, href }: any) => <a href={href} data-testid='link'>{children}</a>
}));

describe('ErrorCard', () => {
    it('renders with default icon and content', () => {
        render(
            <ErrorCard
                title="Something went wrong"
                description="Please try again later."
            />
        );

        expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
        expect(screen.getByText('Please try again later.')).toBeInTheDocument();

        // Icon fallback (warning)
        const icon = screen.getByTestId('img');
        expect(icon).toHaveClass('h-10 w-10');
    });

    it('renders retry link when retryLink is provided', () => {
        render(
            <ErrorCard
                title="Error"
                description="Something happened"
                retryLink="/retry"
                retryLinkText="Try again"
            />
        );

        const link = screen.getByTestId('link');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/retry');
    });

    it('applies custom className to Card', () => {
        const { container } = render(
            <ErrorCard
                title="Error"
                description="Styled"
                className="custom-class"
            />
        );

        expect(container.firstChild).toHaveClass('custom-class');
    });
});
