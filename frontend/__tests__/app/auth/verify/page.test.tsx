import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  pushMock,
  replaceMock,
  verifyEmailCodeMock,
  resendVerificationMock,
  verifyEmailTokenMock,
  toastSuccessMock,
  toastErrorMock
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  verifyEmailCodeMock: vi.fn(),
  resendVerificationMock: vi.fn(),
  verifyEmailTokenMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock })
}));

vi.mock('@/lib/auth-client', () => ({
  verifyEmailCode: verifyEmailCodeMock,
  resendVerification: resendVerificationMock,
  verifyEmailToken: verifyEmailTokenMock
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock
  }
}));

import VerifyEmailRequiredPage from '@/app/(auth)/verify-email-required/page';
import VerifyEmailPage from '@/app/(auth)/verify-email/page';

describe('VerifyEmailRequiredPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/verify-email-required?email=user%40example.com');
  });

  it('loads the email from the query, normalizes the code, verifies, and resends', async () => {
    const user = userEvent.setup();
    verifyEmailCodeMock.mockResolvedValue({ ok: true });
    resendVerificationMock.mockResolvedValue({ message: 'Verification sent again' });

    render(<VerifyEmailRequiredPage />);

    const codeInput = screen.getByPlaceholderText(/6-digit verification code/i);
    await user.type(codeInput, '12a34b56');
    expect(codeInput).toHaveValue('123456');

    await user.click(screen.getByRole('button', { name: /verify code/i }));
    await waitFor(() => {
      expect(verifyEmailCodeMock).toHaveBeenCalledWith('user@example.com', '123456');
      expect(pushMock).toHaveBeenCalledWith('/projects');
    });

    await user.click(screen.getByRole('button', { name: /resend verification code/i }));
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith('Verification sent again');
    });
  });

  it('accepts a manually entered email when the query string is empty', async () => {
    window.history.replaceState({}, '', '/verify-email-required');
    const user = userEvent.setup();
    resendVerificationMock.mockResolvedValue({});

    render(<VerifyEmailRequiredPage />);

    const resendButton = screen.getByRole('button', { name: /resend verification code/i });
    expect(resendButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/email/i), 'typed@example.com');
    expect(resendButton).toBeEnabled();

    await user.click(resendButton);
    await waitFor(() => {
      expect(resendVerificationMock).toHaveBeenCalledWith('typed@example.com');
      expect(toastSuccessMock).toHaveBeenCalledWith('Verification email sent successfully.');
    });
  });

  it('shows verification and resend errors', async () => {
    const user = userEvent.setup();
    verifyEmailCodeMock.mockRejectedValueOnce(new Error('Bad code'));
    resendVerificationMock.mockRejectedValueOnce(new Error('Retry later'));

    render(<VerifyEmailRequiredPage />);

    await user.type(screen.getByPlaceholderText(/6-digit verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Bad code');
    });

    await user.click(screen.getByRole('button', { name: /resend verification code/i }));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Retry later');
    });
  });
});

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/verify-email');
  });

  it('shows the missing token state when no token exists', () => {
    render(<VerifyEmailPage />);
    expect(screen.getByText('Missing verification token.')).toBeInTheDocument();
  });

  it('verifies the token and redirects to projects', async () => {
    window.history.replaceState({}, '', '/verify-email?token=token-1');
    verifyEmailTokenMock.mockResolvedValue({ ok: true });
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(verifyEmailTokenMock).toHaveBeenCalledWith('token-1');
      expect(replaceMock).toHaveBeenCalledWith('/projects');
    });
  });

  it('shows verification errors', async () => {
    window.history.replaceState({}, '', '/verify-email?token=token-1');
    verifyEmailTokenMock.mockRejectedValue(new Error('Token invalid'));
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Token invalid');
    });
  });
});
