import { beforeEach, describe, expect, it, vi } from 'vitest';

const { makeRequestMock, getBackendUrlMock, buildBackendHeadersMock } = vi.hoisted(() => ({
  makeRequestMock: vi.fn(),
  getBackendUrlMock: vi.fn(),
  buildBackendHeadersMock: vi.fn()
}));

vi.mock('@/lib/request', () => ({
  default: makeRequestMock
}));

vi.mock('@/lib/backend-url', () => ({
  default: getBackendUrlMock
}));

vi.mock('@/lib/auth-request', () => ({
  buildBackendHeaders: buildBackendHeadersMock
}));

import { getCurrentUser } from '@/app/_actions/auth';

describe('app/_actions/auth', () => {
  const originalPublicBackend = process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = 'https://public.example';
    getBackendUrlMock.mockReturnValue('https://internal.example');
    buildBackendHeadersMock.mockResolvedValue({ Cookie: 'session=abc' });
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = originalPublicBackend;
  });

  it('returns null when no backend url is configured', async () => {
    getBackendUrlMock.mockReturnValue(null);

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(buildBackendHeadersMock).not.toHaveBeenCalled();
    expect(makeRequestMock).not.toHaveBeenCalled();
  });

  it('returns the current user with an avatar url when available', async () => {
    makeRequestMock.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User Example',
      isEmailVerified: true,
      roles: ['user'],
      hasAvatar: true,
      avatarUpdatedAt: '2026-04-02T10:00:00.000Z'
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User Example',
      isEmailVerified: true,
      roles: ['user'],
      hasAvatar: true,
      avatarUpdatedAt: '2026-04-02T10:00:00.000Z',
      avatarUrl: 'https://public.example/api/auth/me/avatar?v=2026-04-02T10%3A00%3A00.000Z'
    });

    expect(buildBackendHeadersMock).toHaveBeenCalledWith({ asJson: false });
    const request = makeRequestMock.mock.calls[0][0] as Request;
    expect(request.url).toBe('https://internal.example/api/auth/me');
    expect(makeRequestMock.mock.calls[0][1]).toEqual(['auth-user']);
  });

  it('uses the avatar endpoint without a version query when no timestamp exists', async () => {
    makeRequestMock.mockResolvedValue({
      id: 'user-plain-avatar',
      email: 'avatar@example.com',
      name: 'Avatar User',
      isEmailVerified: true,
      roles: ['user'],
      hasAvatar: true
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: 'user-plain-avatar',
      email: 'avatar@example.com',
      name: 'Avatar User',
      isEmailVerified: true,
      roles: ['user'],
      hasAvatar: true,
      avatarUrl: 'https://public.example/api/auth/me/avatar'
    });
  });

  it('omits avatarUrl when no avatar or public backend exists and returns null on request failure', async () => {
    makeRequestMock.mockResolvedValueOnce({
      id: 'user-2',
      email: 'plain@example.com',
      name: 'Plain User',
      isEmailVerified: false,
      roles: [],
      hasAvatar: false
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: 'user-2',
      email: 'plain@example.com',
      name: 'Plain User',
      isEmailVerified: false,
      roles: [],
      hasAvatar: false,
      avatarUrl: undefined
    });

    process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = '';
    makeRequestMock.mockResolvedValueOnce({
      id: 'user-3',
      email: 'avatar@example.com',
      name: 'Avatar User',
      isEmailVerified: true,
      roles: ['admin'],
      hasAvatar: true
    });

    await expect(getCurrentUser()).resolves.toEqual({
      id: 'user-3',
      email: 'avatar@example.com',
      name: 'Avatar User',
      isEmailVerified: true,
      roles: ['admin'],
      hasAvatar: true,
      avatarUrl: undefined
    });

    makeRequestMock.mockRejectedValueOnce(new Error('boom'));
    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
