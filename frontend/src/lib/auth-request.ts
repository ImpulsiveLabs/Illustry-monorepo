import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = process.env.NEXT_PUBLIC_AUTH_CSRF_COOKIE_NAME || 'illustry_csrf';

const getCookieStore = async () => {
  try {
    return await cookies();
  } catch {
    return null;
  }
};

const buildForwardedCookieHeader = async (): Promise<string | undefined> => {
  const cookieStore = await getCookieStore();
  if (!cookieStore) {
    return undefined;
  }
  const entries = cookieStore.getAll();

  if (entries.length === 0) {
    return undefined;
  }

  return entries.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
};

const buildBackendHeaders = async (options?: {
  asJson?: boolean;
  withCsrf?: boolean;
  extraHeaders?: Record<string, string>;
}): Promise<HeadersInit> => {
  const asJson = options?.asJson ?? true;
  const withCsrf = options?.withCsrf ?? true;

  const cookieStore = await getCookieStore();
  const headers: Record<string, string> = options?.extraHeaders ? { ...options.extraHeaders } : {};

  if (asJson) {
    headers['Content-Type'] = 'application/json';
  }

  const cookieHeader = await buildForwardedCookieHeader();

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (withCsrf) {
    const csrfToken = cookieStore?.get(CSRF_COOKIE_NAME)?.value;
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return headers;
};

export {
  buildBackendHeaders,
  CSRF_COOKIE_NAME
};
