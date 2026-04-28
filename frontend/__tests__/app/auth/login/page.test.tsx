import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  pushMock,
  loginUserMock,
  isGoogleAuthEnabledMock,
  getGoogleAuthStartUrlMock,
  toastErrorMock
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  loginUserMock: vi.fn(),
  isGoogleAuthEnabledMock: vi.fn(),
  getGoogleAuthStartUrlMock: vi.fn(),
  toastErrorMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock })
}));

vi.mock('@/lib/auth-client', () => ({
  loginUser: loginUserMock,
  isGoogleAuthEnabled: isGoogleAuthEnabledMock,
  getGoogleAuthStartUrl: getGoogleAuthStartUrlMock
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock
  }
}));

import LoginPage from '@/app/(auth)/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/login');
    isGoogleAuthEnabledMock.mockReturnValue(false);
    getGoogleAuthStartUrlMock.mockReturnValue('https://accounts.example/google');
  });

  it('reads the next route and oauth error from the query string', async () => {
    window.history.replaceState({}, '', '/login?next=%2Fdashboards&error=google_auth_failed');
    render(<LoginPage />);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Google sign-in failed. Please try again.');
    });

    const user = userEvent.setup();
    loginUserMock.mockResolvedValue({ user: { email: 'user@example.com', isEmailVerified: true } });
    await user.type(screen.getByLabelText(/^email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Secret123!Secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboards');
    });
  });

  it('redirects unverified users to verify-email-required and handles login errors', async () => {
    const user = userEvent.setup();
    loginUserMock
      .mockResolvedValueOnce({ user: { email: 'user@example.com', isEmailVerified: false } })
      .mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/^email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Secret123!Secret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/verify-email-required?email=user%40example.com');
    });

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('shows the google button when enabled and starts the google flow', async () => {
    isGoogleAuthEnabledMock.mockReturnValue(true);
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: 'http://localhost/login' }
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(getGoogleAuthStartUrlMock).toHaveBeenCalledWith('/projects');
    expect(window.location.href).toBe('https://accounts.example/google');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation
    });
  });
});
