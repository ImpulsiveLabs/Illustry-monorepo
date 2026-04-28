import React from 'react';
import { render, screen } from '@testing-library/react';
import DataLayout from '@/app/(data)/layout';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { getCurrentUser } from '@/app/_actions/auth';

vi.mock('@/components/layouts/site-header', () => ({
  __esModule: true,
  default: () => <header data-testid="mock-site-header">Mocked SiteHeader</header>,
}));

vi.mock('@/app/_actions/auth', () => ({
  getCurrentUser: vi.fn()
}));

describe('DataLayout', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      isEmailVerified: true,
      roles: []
    });
  });

  it('renders SiteHeader and children correctly', async () => {
    const ui = await DataLayout({
      children: <div data-testid="layout-child">Child Content</div>
    });
    render(ui);

    expect(screen.getByTestId('mock-site-header')).toBeInTheDocument();
    expect(screen.getByTestId('layout-child')).toHaveTextContent('Child Content');
  });
});
