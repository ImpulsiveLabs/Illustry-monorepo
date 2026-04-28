import { render, screen } from '@testing-library/react';
import React from 'react';
import IntroLayout from '@/app/(intro)/layout';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { getCurrentUser } from '@/app/_actions/auth';

// Mock SiteHeader to isolate the test
vi.mock('@/components/layouts/site-header', () => ({
  __esModule: true,
  default: () => <header data-testid="site-header">Mock SiteHeader</header>,
}));

vi.mock('@/app/_actions/auth', () => ({
  getCurrentUser: vi.fn()
}));

describe('IntroLayout', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      isEmailVerified: true,
      roles: []
    });
  });

  it('renders SiteHeader and children', async () => {
    const ui = await IntroLayout({
      children: <div data-testid="child">Hello, world!</div>
    });
    render(ui);

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Hello, world!');
  });
});
