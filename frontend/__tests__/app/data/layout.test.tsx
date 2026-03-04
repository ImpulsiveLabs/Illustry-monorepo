import React from 'react';
import { render, screen } from '@testing-library/react';
import DataLayout from '@/app/(data)/layout';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/layouts/site-header', () => ({
  __esModule: true,
  default: () => <header data-testid="mock-site-header">Mocked SiteHeader</header>,
}));

describe('DataLayout', () => {
  it('renders SiteHeader and children correctly', () => {
    render(
      <DataLayout>
        <div data-testid="layout-child">Child Content</div>
      </DataLayout>
    );

    // Check the mocked SiteHeader is rendered
    expect(screen.getByTestId('mock-site-header')).toBeInTheDocument();

    // Check the child content is rendered
    expect(screen.getByTestId('layout-child')).toHaveTextContent('Child Content');
  });
});
