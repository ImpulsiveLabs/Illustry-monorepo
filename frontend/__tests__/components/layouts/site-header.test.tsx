import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SiteHeader from '@/components/layouts/site-header';

vi.mock('@/components/layouts/main-nav', () => ({
    default: () => <nav data-testid="main-nav" />
}));

vi.mock('@/components/layouts/mobile-nav', () => ({
    default: () => <nav data-testid="mobile-nav" />
}));

describe('SiteHeader', () => {
    it('renders both navigation variants', () => {
        render(<SiteHeader />);

        expect(screen.getByTestId('main-nav')).toBeInTheDocument();
        expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    });
});
