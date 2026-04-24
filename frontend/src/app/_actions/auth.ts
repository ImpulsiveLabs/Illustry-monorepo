'use server';

import makeRequest from '@/lib/request';
import getBackendUrl from '@/lib/backend-url';
import { buildBackendHeaders } from '@/lib/auth-request';
import type { CurrentUser } from '@/lib/auth-user';

const getCurrentUser = async (): Promise<CurrentUser | null> => {
  const backend = getBackendUrl();
  if (!backend) {
    return null;
  }

  const request = new Request(`${backend}/api/auth/me`, {
    method: 'GET',
    headers: await buildBackendHeaders({ asJson: false })
  });

  try {
    const user = await makeRequest<CurrentUser>(request, ['auth-user']);
    const publicBackendUrl = process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL;

    return {
      ...user,
      avatarUrl: user.hasAvatar && publicBackendUrl
        ? `${publicBackendUrl}/api/auth/me/avatar${user.avatarUpdatedAt ? `?v=${encodeURIComponent(user.avatarUpdatedAt)}` : ''}`
        : undefined
    };
  } catch {
    return null;
  }
};

export {
  getCurrentUser
};
