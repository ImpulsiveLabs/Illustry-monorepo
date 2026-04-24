import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { pushMock, registerUserMock, toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  registerUserMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock })
}));

vi.mock('@/lib/auth-client', () => ({
  registerUser: registerUserMock
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock
  }
}));

import RegisterPage from '@/app/(auth)/register/page';

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps submit disabled until the password rules and name length are satisfied', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const submit = screen.getByRole('button', { name: /create account/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/name/i), 'V');
    await user.type(screen.getByLabelText(/password/i), 'weak');
    expect(submit).toBeDisabled();

    await user.clear(screen.getByLabelText(/name/i));
    await user.type(screen.getByLabelText(/name/i), 'Vlad');
    await user.clear(screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword1!');

    expect(submit).toBeEnabled();
    expect(screen.getAllByText(/at least/i).length).toBeGreaterThan(0);
  });

  it('submits registration with avatar and redirects to verify-email-required', async () => {
    const user = userEvent.setup();
    registerUserMock.mockResolvedValue({
      user: {
        email: 'user@example.com'
      }
    });

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/name/i), 'Vlad');
    await user.type(screen.getByLabelText(/^email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword1!');

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/avatar/i), file);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(registerUserMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'StrongPassword1!',
        name: 'Vlad',
        avatar: file
      });
    });

    expect(pushMock).toHaveBeenCalledWith('/verify-email-required?email=user%40example.com');
    expect(toastSuccessMock).toHaveBeenCalledWith('Account created. Check your inbox for the verification email.');
  });

  it('shows submission errors and resets the pending state', async () => {
    const user = userEvent.setup();
    registerUserMock.mockRejectedValue(new Error('Registration failed'));

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/name/i), 'Vlad');
    await user.type(screen.getByLabelText(/^email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'StrongPassword1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Registration failed');
    });
    expect(screen.getByRole('button', { name: /create account/i })).toBeEnabled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
