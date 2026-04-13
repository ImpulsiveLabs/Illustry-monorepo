const CSRF_COOKIE_NAME = process.env.NEXT_PUBLIC_AUTH_CSRF_COOKIE_NAME || 'illustry_csrf';
const LOCALE_COOKIE_NAME = 'illustry-locale';
const isGoogleAuthEnabled = () => process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';

type AuthUserResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    isEmailVerified: boolean;
    roles: string[];
    hasAvatar: boolean;
    avatarUpdatedAt?: string;
  } | null;
};

const getBackendPublicUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_BACKEND_PUBLIC_URL is not configured');
  }
  return url;
};

const getCookieValue = (cookieName: string): string | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const values = document.cookie
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  const matched = values.find((part) => part.startsWith(`${cookieName}=`));
  if (!matched) {
    return undefined;
  }

  return decodeURIComponent(matched.slice(cookieName.length + 1));
};

const getPreferredLocale = (): string | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const cookieLocale = getCookieValue(LOCALE_COOKIE_NAME);
  if (cookieLocale) {
    return cookieLocale;
  }

  const storageLocale = window.localStorage.getItem(LOCALE_COOKIE_NAME);
  if (storageLocale) {
    return storageLocale;
  }

  if (document.documentElement.lang) {
    return document.documentElement.lang;
  }

  return window.navigator.language;
};

const authRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const locale = getPreferredLocale();
  const response = await fetch(`${getBackendPublicUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.headers || {}),
      ...(locale ? { 'X-Illustry-Locale': locale, 'Accept-Language': locale } : {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
};

const registerUser = async (payload: {
  email: string;
  password: string;
  name: string;
  avatar?: File | null;
}): Promise<AuthUserResponse> => {
  const formData = new FormData();
  formData.set('email', payload.email);
  formData.set('password', payload.password);
  formData.set('name', payload.name);

  if (payload.avatar) {
    formData.set('avatar', payload.avatar);
  }

  return authRequest<AuthUserResponse>('/api/auth/register', {
    method: 'POST',
    body: formData
  });
};

const getGoogleAuthStartUrl = (next = '/projects') => (
  `${getBackendPublicUrl()}/api/auth/google/start?next=${encodeURIComponent(next)}`
);

const loginUser = (email: string, password: string) => authRequest<AuthUserResponse>(
  '/api/auth/login',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }
);

const logoutUser = async () => {
  const csrfToken = getCookieValue(CSRF_COOKIE_NAME);
  await authRequest<{ ok: boolean }>('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
    }
  });
};

const requestPasswordReset = (email: string) => authRequest<{ message: string }>('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email })
});

const resetPassword = (token: string, password: string) => authRequest<{ ok: boolean }>('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, password })
});

const verifyEmailToken = (token: string) => authRequest<{ ok: boolean }>('/api/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
});

const verifyEmailCode = (email: string, code: string) => authRequest<{ ok: boolean }>('/api/auth/verify-email-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, code })
});

const resendVerification = (email?: string) => authRequest<{ message: string }>('/api/auth/resend-verification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(email ? { email } : {})
});

export {
  registerUser,
  getGoogleAuthStartUrl,
  isGoogleAuthEnabled,
  loginUser,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  verifyEmailToken,
  verifyEmailCode,
  resendVerification
};
