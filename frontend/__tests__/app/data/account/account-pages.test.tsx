import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccountPage from '@/app/(data)/account/page';
import AccountEditPage from '@/app/(data)/account/edit/page';
import { getCurrentUser } from '@/app/_actions/auth';
import { redirect } from 'next/navigation';

vi.mock('@/app/_actions/auth', () => ({
  getCurrentUser: vi.fn()
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  })
}));

vi.mock('@/components/account/account-overview', () => ({
  __esModule: true,
  default: ({ user }: { user: { email: string } }) => (
    <div data-testid="account-overview">{user.email}</div>
  )
}));

vi.mock('@/components/account/account-edit-form', () => ({
  __esModule: true,
  default: ({ user }: { user: { email: string } }) => (
    <div data-testid="account-edit-form">{user.email}</div>
  )
}));

const currentUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'User',
  isEmailVerified: true,
  roles: ['user'],
  hasAvatar: false
};

describe('account pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the account overview page when authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser);

    render(await AccountPage());

    expect(screen.getByTestId('account-overview')).toHaveTextContent('user@example.com');
  });

  it('renders the account edit page when authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser);

    render(await AccountEditPage());

    expect(screen.getByTestId('account-edit-form')).toHaveTextContent('user@example.com');
  });

  it('redirects both account pages when unauthenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    await expect(AccountPage()).rejects.toThrow('redirect:/login');
    await expect(AccountEditPage()).rejects.toThrow('redirect:/login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });
});
