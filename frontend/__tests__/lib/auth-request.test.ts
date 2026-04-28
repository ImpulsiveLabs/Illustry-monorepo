import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn()
}));

vi.mock('next/headers', () => ({
  cookies: cookiesMock
}));

import { buildBackendHeaders, CSRF_COOKIE_NAME } from '@/lib/auth-request';

describe('auth-request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds json headers with forwarded cookies, csrf token and extra headers', async () => {
    cookiesMock.mockResolvedValue({
      getAll: () => [
        { name: 'session', value: 'abc' },
        { name: 'theme', value: 'dark' }
      ],
      get: (name: string) => (name === CSRF_COOKIE_NAME ? { value: 'csrf-token' } : undefined)
    });

    await expect(buildBackendHeaders({
      asJson: true,
      withCsrf: true,
      extraHeaders: { Authorization: 'Bearer test' }
    })).resolves.toEqual({
      Authorization: 'Bearer test',
      'Content-Type': 'application/json',
      Cookie: 'session=abc; theme=dark',
      'X-CSRF-Token': 'csrf-token'
    });
  });

  it('omits json and cookie headers when cookie store is empty', async () => {
    cookiesMock.mockResolvedValue({
      getAll: () => [],
      get: () => undefined
    });

    await expect(buildBackendHeaders({ asJson: false, withCsrf: true })).resolves.toEqual({});
  });

  it('falls back cleanly when next cookies are unavailable', async () => {
    cookiesMock.mockRejectedValue(new Error('no request context'));

    await expect(buildBackendHeaders({ withCsrf: true })).resolves.toEqual({
      'Content-Type': 'application/json'
    });
  });

  it('uses default json options when none are provided', async () => {
    cookiesMock.mockResolvedValue({
      getAll: () => [
        { name: 'session', value: 'xyz' },
        { name: CSRF_COOKIE_NAME, value: 'csrf-default' }
      ],
      get: (name: string) => (name === CSRF_COOKIE_NAME ? { value: 'csrf-default' } : undefined)
    });

    await expect(buildBackendHeaders()).resolves.toEqual({
      'Content-Type': 'application/json',
      Cookie: `session=xyz; ${CSRF_COOKIE_NAME}=csrf-default`,
      'X-CSRF-Token': 'csrf-default'
    });
  });
});
