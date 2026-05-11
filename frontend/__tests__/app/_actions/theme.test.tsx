import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeTypes } from '@illustry/types';

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

import {
  getUserThemeConfig,
  resetUserThemeConfig,
  saveUserThemeConfig
} from '@/app/_actions/theme';

describe('app/_actions/theme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBackendUrlMock.mockReturnValue('https://internal.example');
    buildBackendHeadersMock.mockResolvedValue({ Cookie: 'session=abc' });
  });

  it('gets, saves, and resets normalized user theme config', async () => {
    makeRequestMock.mockResolvedValueOnce({
      themeConfig: {
        version: 1,
        presetId: 'stored',
        global: { primary: '#123456' }
      }
    });

    await expect(getUserThemeConfig()).resolves.toMatchObject({
      version: 1,
      presetId: 'stored',
      global: expect.objectContaining({ primary: '#123456' })
    });
    expect(buildBackendHeadersMock).toHaveBeenCalledWith({ asJson: false, withCsrf: false });
    expect((makeRequestMock.mock.calls[0][0] as Request).url).toBe('https://internal.example/api/auth/me/theme');

    const themeConfig = ThemeTypes.normalizeAppThemeConfig({
      presetId: 'custom',
      global: { primary: '#abcdef' }
    });
    makeRequestMock.mockResolvedValueOnce({ themeConfig });

    await expect(saveUserThemeConfig(themeConfig)).resolves.toMatchObject({
      presetId: 'custom',
      global: expect.objectContaining({ primary: '#abcdef' })
    });
    const saveRequest = makeRequestMock.mock.calls[1][0] as Request;
    expect(saveRequest.method).toBe('PUT');
    await expect(saveRequest.json()).resolves.toMatchObject({
      themeConfig: expect.objectContaining({
        version: 1,
        presetId: 'custom'
      })
    });

    makeRequestMock.mockResolvedValueOnce({ themeConfig: ThemeTypes.normalizeAppThemeConfig() });
    await expect(resetUserThemeConfig()).resolves.toMatchObject({
      presetId: 'default'
    });
    expect((makeRequestMock.mock.calls[2][0] as Request).method).toBe('DELETE');
  });

  it('returns safe fallbacks when backend url or requests fail', async () => {
    getBackendUrlMock.mockReturnValueOnce(null);
    await expect(getUserThemeConfig()).resolves.toBeNull();

    getBackendUrlMock.mockReturnValueOnce(null);
    await expect(saveUserThemeConfig(ThemeTypes.normalizeAppThemeConfig())).resolves.toBeNull();

    getBackendUrlMock.mockReturnValueOnce(null);
    await expect(resetUserThemeConfig()).resolves.toMatchObject({ presetId: 'default' });

    getBackendUrlMock.mockReturnValue('https://internal.example');
    makeRequestMock.mockRejectedValue(new Error('boom'));
    await expect(getUserThemeConfig()).resolves.toBeNull();
    await expect(saveUserThemeConfig(ThemeTypes.normalizeAppThemeConfig())).resolves.toBeNull();
    await expect(resetUserThemeConfig()).resolves.toBeNull();
  });
});
