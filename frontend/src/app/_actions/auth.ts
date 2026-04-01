'use server';

import makeRequest from '@/lib/request';
import getBackendUrl from '@/lib/backend-url';
import { buildBackendHeaders } from '@/lib/auth-request';

type CurrentUser = {
  id: string;
  email: string;
  isEmailVerified: boolean;
  roles: string[];
};

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
    return await makeRequest<CurrentUser>(request, ['auth-user']);
  } catch {
    return null;
  }
};

export {
  getCurrentUser
};
