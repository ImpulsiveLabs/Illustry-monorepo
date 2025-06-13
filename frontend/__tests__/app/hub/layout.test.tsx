import { render, screen } from '@testing-library/react';
import React from 'react';
import HubLayout from '@/app/(hub)/layout';
import { describe, it, expect, vi } from 'vitest';

// 👉 Mock SiteHeader component
vi.mock('@/components/layouts/site-header', () => ({
  __esModule: true,
  default: () => <div data-testid="site-header">Mock Site Header</div>,
}));

describe('HubLayout', () => {
  it('renders SiteHeader and children', () => {
    render(
      <HubLayout>
        <div data-testid="main-content">Main Content</div>
      </HubLayout>
    );

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  // Optional test if you add SiteFooter in the future
  // it('renders SiteFooter if uncommented', () => {
  //   expect(screen.getByTestId('site-footer')).toBeInTheDocument();
  // });
});
