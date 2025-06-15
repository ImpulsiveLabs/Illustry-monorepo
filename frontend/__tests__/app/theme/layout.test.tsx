import { render, screen } from '@testing-library/react';
import React from 'react';
import ThemeLayout from '@/app/theme/layout';
import { describe, it, expect, vi } from 'vitest';

// Mock SiteHeader to isolate the test
vi.mock('@/components/layouts/site-header', () => ({
  __esModule: true,
  default: () => <header data-testid="site-header">Mock SiteHeader</header>,
}));

describe('ThemeLayout', () => {
  it('renders SiteHeader and children', () => {
    render(
      <ThemeLayout>
        <div data-testid="child">Hello, world!</div>
      </ThemeLayout>
    );

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Hello, world!');
  });
});
