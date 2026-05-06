import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountOverview from '@/components/account/account-overview';
import AccountEditForm from '@/components/account/account-edit-form';
import { changePassword, updateProfile } from '@/lib/auth-client';
import { toast } from 'sonner';

const routerRefreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: routerRefreshMock
  })
}));

vi.mock('@/components/providers/locale-provider', () => ({
  useLocale: () => ({
    t: (key: string) => key
  })
}));

vi.mock('@/lib/auth-client', () => ({
  changePassword: vi.fn(),
  updateProfile: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

const verifiedUser = {
  id: 'user-1',
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  isEmailVerified: true,
  roles: ['user'],
  hasAvatar: true,
  avatarUrl: 'https://cdn.example.com/avatar.png'
};

describe('account components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateProfile).mockResolvedValue({} as never);
    vi.mocked(changePassword).mockResolvedValue({} as never);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:http://localhost/avatar-preview')
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn()
    });
  });

  it('renders the account overview with avatar and verification state', () => {
    render(<AccountOverview user={verifiedUser} />);

    expect(screen.getByRole('heading', { name: 'auth.account.title' })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getAllByText('ada@example.com')).toHaveLength(2);
    expect(screen.getAllByText('auth.account.verified')).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'Ada Lovelace avatar' })).toHaveAttribute('src', verifiedUser.avatarUrl);
  });

  it('renders initials and unverified state when the user has no avatar', () => {
    render(<AccountOverview user={{
      ...verifiedUser,
      name: '',
      email: 'plain@example.com',
      isEmailVerified: false,
      hasAvatar: false,
      avatarUrl: undefined
    }} />);

    expect(screen.getByText('P')).toBeInTheDocument();
    expect(screen.getAllByText('auth.account.unverified')).toHaveLength(2);
  });

  it('updates profile, removes avatar, validates avatar inputs and changes password', async () => {
    const user = userEvent.setup();
    render(<AccountEditForm user={verifiedUser} />);

    await user.clear(screen.getByLabelText('auth.common.name'));
    await user.type(screen.getByLabelText('auth.common.name'), 'Ada Byron');
    await user.click(screen.getByRole('button', { name: /auth.account.saveProfile/ }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({ name: 'Ada Byron', avatar: null });
      expect(toast.success).toHaveBeenCalledWith('auth.toast.profileUpdated');
      expect(routerRefreshMock).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /auth.account.avatarRemove/ }));
    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({ name: 'Ada Byron', removeAvatar: true });
    });

    const fileInput = screen.getByLabelText('auth.common.avatar') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['bad'], 'avatar.gif', { type: 'image/gif' })]
      }
    });
    expect(toast.error).toHaveBeenCalledWith('auth.account.avatarInvalidType');

    fireEvent.change(fileInput, {
      target: {
        files: [new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'avatar.png', { type: 'image/png' })]
      }
    });
    expect(toast.error).toHaveBeenCalledWith('auth.account.avatarTooLarge');

    fireEvent.change(fileInput, {
      target: {
        files: [new File(['ok'], 'avatar.png', { type: 'image/png' })]
      }
    });
    expect(URL.createObjectURL).toHaveBeenCalled();

    await user.type(screen.getByLabelText('auth.common.currentPassword'), 'OldSecret123!');
    await user.type(screen.getByLabelText('auth.common.newPassword'), 'NewSecret123!');
    await user.type(screen.getByLabelText('auth.common.confirmPassword'), 'NewSecret123!');
    await user.click(screen.getByRole('button', { name: /auth.account.savePassword/ }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'OldSecret123!',
        newPassword: 'NewSecret123!'
      });
      expect(toast.success).toHaveBeenCalledWith('auth.toast.passwordUpdated');
    });
  });

  it('shows errors for failed profile and password updates plus mismatched passwords', async () => {
    const user = userEvent.setup();
    vi.mocked(updateProfile).mockRejectedValueOnce(new Error('profile failed') as never);
    vi.mocked(changePassword).mockRejectedValueOnce(new Error('password failed') as never);
    render(<AccountEditForm user={{ ...verifiedUser, avatarUrl: 'javascript:alert(1)' }} />);

    expect(screen.getByText('AL')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('auth.common.name'));
    await user.type(screen.getByLabelText('auth.common.name'), 'Ada Error');
    await user.click(screen.getByRole('button', { name: /auth.account.saveProfile/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('profile failed'));

    await user.type(screen.getByLabelText('auth.common.currentPassword'), 'OldSecret123!');
    await user.type(screen.getByLabelText('auth.common.newPassword'), 'NewSecret123!');
    await user.type(screen.getByLabelText('auth.common.confirmPassword'), 'Mismatch123!');
    fireEvent.submit(screen.getByLabelText('auth.common.confirmPassword').closest('form') as HTMLFormElement);
    expect(toast.error).toHaveBeenCalledWith('auth.account.passwordMismatch');

    await user.clear(screen.getByLabelText('auth.common.confirmPassword'));
    await user.type(screen.getByLabelText('auth.common.confirmPassword'), 'NewSecret123!');
    await user.click(screen.getByRole('button', { name: /auth.account.savePassword/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('password failed'));
  });

  it('handles empty avatar selection, unchanged profile submit and remove avatar errors', async () => {
    const user = userEvent.setup();
    vi.mocked(updateProfile).mockRejectedValueOnce(new Error('remove failed') as never);
    render(<AccountEditForm user={verifiedUser} />);

    fireEvent.submit(screen.getByLabelText('auth.common.name').closest('form') as HTMLFormElement);
    expect(updateProfile).not.toHaveBeenCalled();

    const fileInput = screen.getByLabelText('auth.common.avatar') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: []
      }
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /auth.account.avatarRemove/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('remove failed'));
  });
});
