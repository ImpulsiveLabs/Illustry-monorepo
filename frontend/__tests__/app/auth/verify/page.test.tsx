import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pushMock, verifyEmailCodeMock, resendVerificationMock, verifyEmailTokenMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  verifyEmailCodeMock: vi.fn(),
  resendVerificationMock: vi.fn(),
  verifyEmailTokenMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock })
}));

vi.mock('@/lib/auth-client', () => ({
  verifyEmailCode: verifyEmailCodeMock,
  resendVerification: resendVerificationMock,
  verifyEmailToken: verifyEmailTokenMock
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
    expect(await screen.findByText('Verification sent again')).toBeInTheDocument();
  });

  it('shows verification and resend errors', async () => {
    const user = userEvent.setup();
    verifyEmailCodeMock.mockRejectedValueOnce(new Error('Bad code'));
    resendVerificationMock.mockRejectedValueOnce(new Error('Retry later'));

    render(<VerifyEmailRequiredPage />);

    await user.type(screen.getByPlaceholderText(/6-digit verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));
    expect(await screen.findByText('Bad code')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /resend verification code/i }));
    expect(await screen.findByText('Retry later')).toBeInTheDocument();
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
    const user = userEvent.setup();

    render(<VerifyEmailPage />);

    await user.click(screen.getByRole('button', { name: /verify email/i }));
    await waitFor(() => {
      expect(verifyEmailTokenMock).toHaveBeenCalledWith('token-1');
      expect(pushMock).toHaveBeenCalledWith('/projects');
    });
  });

  it('shows verification errors', async () => {
    window.history.replaceState({}, '', '/verify-email?token=token-1');
    verifyEmailTokenMock.mockRejectedValue(new Error('Token invalid'));
    const user = userEvent.setup();

    render(<VerifyEmailPage />);

    await user.click(screen.getByRole('button', { name: /verify email/i }));
    expect(await screen.findByText('Token invalid')).toBeInTheDocument();
  });
});
