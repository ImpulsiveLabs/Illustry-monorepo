import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStoredTheme } from '@/lib/theme-mode';

describe('lib/theme-mode', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns dark only when local storage contains dark', () => {
    expect(getStoredTheme()).toBe('light');

    localStorage.setItem('theme', 'dark');
    expect(getStoredTheme()).toBe('dark');

    localStorage.setItem('theme', 'light');
    expect(getStoredTheme()).toBe('light');
  });

  it('falls back to light when window is unavailable', () => {
    vi.stubGlobal('window', undefined);
    expect(getStoredTheme()).toBe('light');
  });

  it('falls back to light when storage access throws', () => {
    const spy = vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(getStoredTheme()).toBe('light');
    expect(spy).toHaveBeenCalledWith('theme');
  });
});
