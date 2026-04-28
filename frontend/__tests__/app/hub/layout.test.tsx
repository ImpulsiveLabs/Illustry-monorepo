import { render, screen } from '@testing-library/react';
import React from 'react';
import HubLayout from '@/app/(hub)/layout';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { getCurrentUser } from '@/app/_actions/auth';

// 👉 Mock SiteHeader component
vi.mock('@/components/layouts/site-header', () => ({
  __esModule: true,
  default: () => <div data-testid="site-header">Mock Site Header</div>,
}));

vi.mock('@/app/_actions/auth', () => ({
  getCurrentUser: vi.fn()
}));

describe('HubLayout', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      isEmailVerified: true,
      roles: []
    });
  });

  it('renders SiteHeader and children', async () => {
    const ui = await HubLayout({
      children: <div data-testid="main-content">Main Content</div>
    });
    render(ui);

    expect(screen.getByTestId('site-header')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });
});
