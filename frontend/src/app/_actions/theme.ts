'use server';

import { ThemeTypes } from '@illustry/types';
import makeRequest from '@/lib/request';
import getBackendUrl from '@/lib/backend-url';
import { buildBackendHeaders } from '@/lib/auth-request';

type ThemeConfigResponse = {
  themeConfig: ThemeTypes.AppThemeConfig;
};

const getUserThemeConfig = async (): Promise<ThemeTypes.AppThemeConfig | null> => {
  const backend = getBackendUrl();
  if (!backend) {
    return null;
  }

  const request = new Request(`${backend}/api/auth/me/theme`, {
    method: 'GET',
    headers: await buildBackendHeaders({ asJson: false, withCsrf: false })
  });

  try {
    const response = await makeRequest<ThemeConfigResponse>(request, ['auth-theme']);
    return ThemeTypes.normalizeAppThemeConfig(response.themeConfig);
  } catch {
    return null;
  }
};

const saveUserThemeConfig = async (
  themeConfig: ThemeTypes.AppThemeConfig
): Promise<ThemeTypes.AppThemeConfig | null> => {
  const backend = getBackendUrl();
  if (!backend) {
    return null;
  }

  const request = new Request(`${backend}/api/auth/me/theme`, {
    method: 'PUT',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify({
      themeConfig: ThemeTypes.normalizeAppThemeConfig(themeConfig)
    })
  });

  try {
    const response = await makeRequest<ThemeConfigResponse>(request, ['auth-theme']);
    return ThemeTypes.normalizeAppThemeConfig(response.themeConfig);
  } catch {
    return null;
  }
};

const resetUserThemeConfig = async (): Promise<ThemeTypes.AppThemeConfig | null> => {
  const backend = getBackendUrl();
  if (!backend) {
    return ThemeTypes.normalizeAppThemeConfig();
  }

  const request = new Request(`${backend}/api/auth/me/theme`, {
    method: 'DELETE',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true })
  });

  try {
    const response = await makeRequest<ThemeConfigResponse>(request, ['auth-theme']);
    return ThemeTypes.normalizeAppThemeConfig(response.themeConfig);
  } catch {
    return null;
  }
};

export {
  getUserThemeConfig,
  resetUserThemeConfig,
  saveUserThemeConfig
};
