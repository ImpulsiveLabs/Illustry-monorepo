import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getGoogleAuthStartUrl,
  isGoogleAuthEnabled,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verifyEmailCode,
  verifyEmailToken
} from '@/lib/auth-client';

describe('auth-client', () => {
  const originalBackendUrl = process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL;
  const originalGoogleFlag = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED;
  const originalCookieDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = 'https://api.example.com';
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = 'false';
    document.cookie = '';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = originalBackendUrl;
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = originalGoogleFlag;
    if (originalCookieDescriptor) {
      Object.defineProperty(globalThis, 'document', originalCookieDescriptor);
    }
  });

  it('reports whether google auth is enabled and builds the start url', () => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = 'true';

    expect(isGoogleAuthEnabled()).toBe(true);
    expect(getGoogleAuthStartUrl('/projects/my space')).toBe(
      'https://api.example.com/api/auth/google/start?next=%2Fprojects%2Fmy%20space'
    );
  });

  it('registers, logs in and logs out with the expected request payloads', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ user: { id: '1' } }),
        text: async () => ''
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ user: { id: '2' } }),
        text: async () => ''
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ ok: true }),
        text: async () => ''
      });

    vi.stubGlobal('fetch', fetchMock as any);

    const avatar = new File(['avatar-bits'], 'avatar.png', { type: 'image/png' });
    await expect(registerUser({
      email: 'user@example.com',
      password: 'secret123',
      name: 'User Example',
      avatar
    })).resolves.toEqual({ user: { id: '1' } });

    const registerCall = fetchMock.mock.calls[0];
    expect(registerCall[0]).toBe('https://api.example.com/api/auth/register');
    expect((registerCall[1] as RequestInit).method).toBe('POST');
    expect((registerCall[1] as RequestInit).credentials).toBe('include');
    const formData = (registerCall[1] as RequestInit).body as FormData;
    expect(formData.get('email')).toBe('user@example.com');
    expect(formData.get('password')).toBe('secret123');
    expect(formData.get('name')).toBe('User Example');
    expect(formData.get('avatar')).toBe(avatar);

    document.cookie = 'illustry_csrf=csrf-login';
    await expect(loginUser('user@example.com', 'secret123')).resolves.toEqual({ user: { id: '2' } });
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.example.com/api/auth/login');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'csrf-login'
      },
      body: JSON.stringify({ email: 'user@example.com', password: 'secret123' })
    });

    document.cookie = 'illustry_csrf=csrf123';
    await expect(logoutUser()).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[2][0]).toBe('https://api.example.com/api/auth/logout');
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'csrf123'
      }
    });
  });

  it('handles missing cookies, optional payloads and non-json responses', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ ok: true }),
        text: async () => ''
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'sent' }),
        text: async () => ''
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ ok: true }),
        text: async () => ''
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ ok: true }),
        text: async () => ''
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'text/plain' },
        json: async () => ({ ignored: true }),
        text: async () => 'plain-ok'
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'resent' }),
        text: async () => ''
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'resent-email' }),
        text: async () => ''
      });

    vi.stubGlobal('fetch', fetchMock as any);

    const originalDocument = document;
    // Cover the document-unavailable branch in cookie parsing.
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: undefined
    });
    await logoutUser();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: { 'Content-Type': 'application/json' }
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument
    });

    await expect(requestPasswordReset('user@example.com')).resolves.toEqual({ message: 'sent' });
    await expect(resetPassword('token-1', 'new-password')).resolves.toEqual({ ok: true });
    await expect(verifyEmailToken('verify-token')).resolves.toEqual({ ok: true });
    await expect(verifyEmailCode('user@example.com', '123456')).resolves.toBe('plain-ok');
    await expect(resendVerification()).resolves.toEqual({ message: 'resent' });
    await expect(resendVerification('user@example.com')).resolves.toEqual({ message: 'resent-email' });

    expect(fetchMock.mock.calls[5][1]).toMatchObject({
      body: JSON.stringify({})
    });
    expect(fetchMock.mock.calls[6][1]).toMatchObject({
      body: JSON.stringify({ email: 'user@example.com' })
    });
  });


  it('sends locale headers from the cookie, localStorage, document language, and navigator fallback', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ user: { id: 'locale-user' } }),
      text: async () => ''
    });

    vi.stubGlobal('fetch', fetchMock as any);

    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(document, 'cookie');
    const originalNavigatorLanguage = window.navigator.language;
    const restoreCookie = () => {
      if (originalCookieDescriptor) {
        Object.defineProperty(document, 'cookie', originalCookieDescriptor);
      }
    };

    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'illustry-locale=ro',
      set: () => undefined
    });
    await loginUser('user@example.com', 'secret123');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: {
        'Content-Type': 'application/json',
        'X-Illustry-Locale': 'ro',
        'Accept-Language': 'ro'
      }
    });

    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => '',
      set: () => undefined
    });
    window.localStorage.setItem('illustry-locale', 'ro');
    await loginUser('user@example.com', 'secret123');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      headers: {
        'Content-Type': 'application/json',
        'X-Illustry-Locale': 'ro',
        'Accept-Language': 'ro'
      }
    });

    window.localStorage.removeItem('illustry-locale');
    document.documentElement.lang = 'ro';
    await loginUser('user@example.com', 'secret123');
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      headers: {
        'Content-Type': 'application/json',
        'X-Illustry-Locale': 'ro',
        'Accept-Language': 'ro'
      }
    });

    document.documentElement.lang = '';
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: 'ro-RO'
    });
    await loginUser('user@example.com', 'secret123');
    expect(fetchMock.mock.calls[3][1]).toMatchObject({
      headers: {
        'Content-Type': 'application/json',
        'X-Illustry-Locale': 'ro-RO',
        'Accept-Language': 'ro-RO'
      }
    });

    restoreCookie();
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: originalNavigatorLanguage
    });
  });

  it('skips the csrf header when no matching cookie exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true }),
      text: async () => ''
    });

    vi.stubGlobal('fetch', fetchMock as any);
    const cookieDescriptor = Object.getOwnPropertyDescriptor(document, 'cookie');
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'other_cookie=value',
      set: () => undefined
    });

    await expect(logoutUser()).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: { 'Content-Type': 'application/json' }
    });

    if (cookieDescriptor) {
      Object.defineProperty(document, 'cookie', cookieDescriptor);
    }
  });

  it('registers without an avatar and handles missing content-type headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      json: async () => ({ ignored: true }),
      text: async () => 'plain-register-response'
    });

    vi.stubGlobal('fetch', fetchMock as any);

    await expect(registerUser({
      email: 'plain@example.com',
      password: 'secret123',
      name: 'Plain User',
      avatar: null
    })).resolves.toBe('plain-register-response');

    const formData = fetchMock.mock.calls[0][1].body as FormData;
    expect(formData.get('avatar')).toBeNull();
  });

  it('surfaces backend and configuration errors', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => 'application/json' },
        json: async () => ({ error: 'invalid credentials' }),
        text: async () => ''
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 418,
        headers: { get: () => 'text/plain' },
        json: async () => ({ ignored: true }),
        text: async () => 'teapot'
      });

    vi.stubGlobal('fetch', fetchMock as any);

    await expect(loginUser('user@example.com', 'bad')).rejects.toThrow('invalid credentials');
    await expect(requestPasswordReset('user@example.com')).rejects.toThrow('Request failed with status 418');

    delete process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL;
    expect(() => getGoogleAuthStartUrl()).toThrow('NEXT_PUBLIC_BACKEND_PUBLIC_URL is not configured');
  });
});
