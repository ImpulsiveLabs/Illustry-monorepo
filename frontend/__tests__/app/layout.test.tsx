import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '@/app/layout';
import React from 'react';

vi.mock('@/components/providers/theme-provider', () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mock-theme-provider">{children}</div>
    ),
    ThemeColorsProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mock-theme-colors-provider">{children}</div>
    ),
}));

vi.mock('@/components/providers/active-project-provider', () => ({
    ActiveProjectProvider: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mock-active-project-provider">{children}</div>
    ),
}));

vi.mock('@/components/ui/toaster', () => ({
    default: () => <div data-testid="mock-toaster" />,
}));

vi.mock('@/lib/utils', () => ({
    cn: (...classes: string[]) => classes.join(' '),
}));

vi.mock('@/lib/fonts', () => ({
    fontSans: { variable: 'font-sans-variable' },
    fontMono: { variable: 'font-mono-variable' },
}));

describe('RootLayout', () => {
    it('renders children and mocked providers', () => {
        render(
            <RootLayout>
                <div data-testid="child">Hello World</div>
            </RootLayout>
        );

        expect(screen.getByTestId('mock-theme-provider')).toBeInTheDocument();
        expect(screen.getByTestId('mock-theme-colors-provider')).toBeInTheDocument();
        expect(screen.getByTestId('mock-active-project-provider')).toBeInTheDocument();
        expect(screen.getByTestId('mock-toaster')).toBeInTheDocument();
        expect(screen.getByTestId('child')).toHaveTextContent('Hello World');
    });

    it('exports metadata correctly', () => {
        expect(metadata.title).toMatchObject({
            default: expect.any(String),
            template: expect.stringContaining('%s')
        });

        expect(metadata.description).toBeTruthy();
        expect(metadata.authors?.[0].name).toBe('Vladimir');
    });
});
