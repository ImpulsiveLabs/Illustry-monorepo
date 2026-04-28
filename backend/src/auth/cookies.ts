import { Response } from 'express';
import {
  cookieDomain,
  cookieSecure,
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  sessionTtlMinutes
} from './constants';

const baseCookieOptions = {
  path: '/',
  secure: cookieSecure,
  sameSite: 'lax' as const,
  domain: cookieDomain
};

const setSessionCookie = (response: Response, token: string, expiresAt: Date) => {
  response.cookie(SESSION_COOKIE_NAME, token, {
    ...baseCookieOptions,
    httpOnly: true,
    expires: expiresAt,
    maxAge: sessionTtlMinutes * 60 * 1000
  });
};

const setCsrfCookie = (response: Response, token: string, expiresAt: Date) => {
  response.cookie(CSRF_COOKIE_NAME, token, {
    ...baseCookieOptions,
    httpOnly: false,
    expires: expiresAt,
    maxAge: sessionTtlMinutes * 60 * 1000
  });
};

const clearAuthCookies = (response: Response) => {
  response.clearCookie(SESSION_COOKIE_NAME, {
    ...baseCookieOptions,
    httpOnly: true
  });

  response.clearCookie(CSRF_COOKIE_NAME, {
    ...baseCookieOptions,
    httpOnly: false
  });
};

export {
  setSessionCookie,
  setCsrfCookie,
  clearAuthCookies
};
