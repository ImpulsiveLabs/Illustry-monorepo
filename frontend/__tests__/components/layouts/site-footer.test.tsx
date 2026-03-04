import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SiteFooter from '@/components/layouts/site-footer';

describe('SiteFooter', () => {
    it('renders footer copyright text', () => {
        render(<SiteFooter />);

        const year = new Date().getFullYear();
        expect(screen.getByText(`© ${year} All rights reserved by Illustry`)).toBeInTheDocument();
    });
});
