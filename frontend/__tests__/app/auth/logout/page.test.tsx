import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { replaceMock, logoutUserMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  logoutUserMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock })
}));

vi.mock('@/lib/auth-client', () => ({
  logoutUser: logoutUserMock
}));

import LogoutPage from '@/app/(auth)/logout/page';

describe('LogoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs out and redirects to login', async () => {
    logoutUserMock.mockResolvedValue(undefined);

    const { unmount } = render(<LogoutPage />);
    expect(screen.getByText('Signing out...')).toBeInTheDocument();

    await waitFor(() => {
      expect(logoutUserMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });

    unmount();
    render(<LogoutPage />);

    await waitFor(() => {
      expect(logoutUserMock).toHaveBeenCalledTimes(2);
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });
});
