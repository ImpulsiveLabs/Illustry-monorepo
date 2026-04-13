import { NextFunction, Request, Response } from 'express';
import Factory from '../factory';
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from './constants';
import { clearAuthCookies } from './cookies';
import { hashOpaqueToken, safeEqual } from './crypto';
import { AuthenticatedRequest } from './types';

const isAuthBypassEnabled = process.env.NODE_ENV === 'test' && process.env.AUTH_TEST_BYPASS === '1';
const bypassUserId = process.env.AUTH_TEST_BYPASS_USER_ID || '__illustry_e2e_user__';
const getAuthBZL = () => Factory.getInstance().getBZL().AuthBZL;

const attachBypassAuth = (request: Request) => {
  request.auth = {
    userId: bypassUserId,
    email: 'e2e-bypass@illustry.local',
    name: 'E2E Bypass',
    isEmailVerified: true,
    roles: ['user'],
    hasAvatar: false,
    authVersion: 0,
    session: ({
      _id: `bypass-session-${bypassUserId}`,
      userId: bypassUserId,
      sessionTokenHash: 'bypass-session-token-hash',
      csrfTokenHash: 'bypass-csrf-token-hash',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      authVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    } as unknown as AuthenticatedRequest['auth']['session'])
  };
};

const unauthorized = (response: Response, message: string) => {
  response.status(401).send({ error: message });
};

const forbidden = (response: Response, message: string) => {
  response.status(403).send({ error: message });
};

const extractClientIp = (request: Request): string | undefined => {
  const forwarded = request.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }

  return request.socket.remoteAddress;
};

const requireAuthenticatedUser = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (isAuthBypassEnabled) {
      attachBypassAuth(request);
      next();
      return;
    }

    const sessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    if (sessionToken === undefined) {
      unauthorized(response, 'Authentication required');
      return;
    }

    const principal = await getAuthBZL().getSessionPrincipalFromToken(sessionToken);

    if (principal === null) {
      clearAuthCookies(response);
      unauthorized(response, 'Authentication required');
      return;
    }

    request.auth = {
      userId: principal.user._id.toString(),
      email: principal.user.email,
      name: principal.user.name,
      isEmailVerified: principal.user.isEmailVerified,
      roles: principal.user.roles,
      hasAvatar: Boolean(principal.user.avatarUpdatedAt),
      avatarUpdatedAt: principal.user.avatarUpdatedAt?.toISOString(),
      authVersion: principal.user.authVersion,
      session: principal.session
    };

    next();
  } catch (error) {
    next(error);
  }
};

const attachAuthenticatedUserIfPresent = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (isAuthBypassEnabled) {
      attachBypassAuth(request);
      next();
      return;
    }

    const sessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    if (sessionToken === undefined) {
      next();
      return;
    }

    const principal = await getAuthBZL().getSessionPrincipalFromToken(sessionToken);

    if (principal === null) {
      clearAuthCookies(response);
      next();
      return;
    }

    request.auth = {
      userId: principal.user._id.toString(),
      email: principal.user.email,
      name: principal.user.name,
      isEmailVerified: principal.user.isEmailVerified,
      roles: principal.user.roles,
      hasAvatar: Boolean(principal.user.avatarUpdatedAt),
      avatarUpdatedAt: principal.user.avatarUpdatedAt?.toISOString(),
      authVersion: principal.user.authVersion,
      session: principal.session
    };

    next();
  } catch (error) {
    next(error);
  }
};

const requireVerifiedEmail = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  if (isAuthBypassEnabled) {
    next();
    return;
  }

  if (request.auth?.isEmailVerified !== true) {
    forbidden(response, 'Email verification required');
    return;
  }

  next();
};

const requireCsrf = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  if (isAuthBypassEnabled) {
    next();
    return;
  }

  const authRequest = request as AuthenticatedRequest;
  const csrfHeader = request.header('x-csrf-token');
  const csrfCookie = request.cookies?.[CSRF_COOKIE_NAME];

  if (csrfHeader === undefined || csrfCookie === undefined) {
    forbidden(response, 'Missing CSRF token');
    return;
  }

  if (safeEqual(csrfHeader, csrfCookie) === false) {
    forbidden(response, 'Invalid CSRF token');
    return;
  }

  const providedHash = hashOpaqueToken(csrfHeader);

  if (safeEqual(providedHash, authRequest.auth.session.csrfTokenHash) === false) {
    forbidden(response, 'Invalid CSRF token');
    return;
  }

  next();
};

const getRequestClientMetadata = (request: Request) => ({
  ipAddress: extractClientIp(request),
  userAgent: request.headers['user-agent']
});

export {
  requireAuthenticatedUser,
  attachAuthenticatedUserIfPresent,
  requireVerifiedEmail,
  requireCsrf,
  getRequestClientMetadata
};
