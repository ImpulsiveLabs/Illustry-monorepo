import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  pushMock,
  requestPasswordResetMock,
  resetPasswordMock,
  toastErrorMock,
  toastSuccessMock
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  requestPasswordResetMock: vi.fn(),
  resetPasswordMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock })
}));

vi.mock('@/lib/auth-client', () => ({
  requestPasswordReset: requestPasswordResetMock,
  resetPassword: resetPasswordMock
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock
  }
}));

import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';
import ResetPasswordPage from '@/app/(auth)/reset-password/page';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/forgot-password');
  });

  it('submits reset requests and renders success and error messages', async () => {
    const user = userEvent.setup();
    requestPasswordResetMock
      .mockResolvedValueOnce({ message: 'Reset email sent' })
      .mockRejectedValueOnce(new Error('Reset failed'));

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText(/email/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith('Reset email sent');
    });

    await user.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Reset failed');
    });
  });
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/reset-password');
  });

  it('shows the missing token state when the token is absent', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText('Missing or invalid reset token.')).toBeInTheDocument();
  });

  it('keeps submit disabled until the password rules pass and confirmation matches', async () => {
    window.history.replaceState({}, '', '/reset-password?token=abc123');
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    const submitButton = screen.getByRole('button', { name: /update password/i });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText(/^new password$/i), 'weak');
    await user.type(screen.getByLabelText(/confirm new password/i), 'weak');
    expect(submitButton).toBeDisabled();

    await user.clear(screen.getByLabelText(/^new password$/i));
    await user.clear(screen.getByLabelText(/confirm new password/i));
    await user.type(screen.getByLabelText(/^new password$/i), 'Secret123!Secret');
    await user.type(screen.getByLabelText(/confirm new password/i), 'Secret123!Mismatch');
    expect(submitButton).toBeDisabled();

    await user.clear(screen.getByLabelText(/confirm new password/i));
    await user.type(screen.getByLabelText(/confirm new password/i), 'Secret123!Secret');
    expect(submitButton).toBeEnabled();
  });

  it('resets the password and redirects to login', async () => {
    window.history.replaceState({}, '', '/reset-password?token=abc123');
    resetPasswordMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), 'Secret123!Secret');
    await user.type(screen.getByLabelText(/confirm new password/i), 'Secret123!Secret');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith('abc123', 'Secret123!Secret');
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
  });

  it('shows reset errors and clears pending state', async () => {
    window.history.replaceState({}, '', '/reset-password?token=abc123');
    resetPasswordMock.mockRejectedValue(new Error('Token expired'));
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), 'Secret123!Secret');
    await user.type(screen.getByLabelText(/confirm new password/i), 'Secret123!Secret');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Token expired');
    });
    expect(screen.getByRole('button', { name: /update password/i })).toBeEnabled();
  });
});
