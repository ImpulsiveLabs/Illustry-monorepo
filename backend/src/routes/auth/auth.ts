import { Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { clearAuthCookies, setCsrfCookie, setSessionCookie } from '../../auth/cookies';
import {
  appBaseUrl,
  cookieDomain,
  cookieSecure,
  GOOGLE_OAUTH_NEXT_COOKIE_NAME,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  googleOauthClientId,
  googleOauthClientSecret,
  googleOauthRedirectUri,
  googleOauthScope,
  SESSION_COOKIE_NAME,
} from '../../auth/constants';
import {
  attachAuthenticatedUserIfPresent,
  authService,
  getRequestClientMetadata,
  requireAuthenticatedUser,
  requireCsrf
} from '../../auth/middleware';
import { createOpaqueToken, safeEqual } from '../../auth/crypto';
import {
  forgotPasswordSchema,
  loginSchema,
  parseDto,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailCodeSchema,
  verifyEmailSchema
} from '../../auth/validation';
import { AuthHttpError, GENERIC_IF_EXISTS_MESSAGE } from '../../auth/errors';

const router = Router();
const googleOauthCookieOptions = {
  path: '/',
  secure: cookieSecure,
  sameSite: 'lax' as const,
  domain: cookieDomain,
  httpOnly: true,
  maxAge: 10 * 60 * 1000
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 25),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_SENSITIVE_RATE_LIMIT_MAX || 8),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

const applySessionCookies = (
  sessionToken: string,
  csrfToken: string,
  expiresAt: Date,
  response: Response
) => {
  setSessionCookie(response, sessionToken, expiresAt);
  setCsrfCookie(response, csrfToken, expiresAt);
};

const sanitizeNextPath = (input?: string): string => {
  if (!input) {
    return '/projects';
  }

  if (input.startsWith('/') === false || input.startsWith('//')) {
    return '/projects';
  }

  return input;
};

const isGoogleOauthConfigured = () => (
  googleOauthClientId.length > 0
  && googleOauthClientSecret.length > 0
  && googleOauthRedirectUri.length > 0
);

const sendAuthError = (response: any, error: unknown) => {
  if (error instanceof AuthHttpError) {
    response.status(error.statusCode).send({ error: error.message });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).send({ error: 'Invalid request payload' });
    return;
  }

  response.status(500).send({ error: 'Authentication request failed' });
};

router.post('/api/auth/register', sensitiveAuthLimiter, async (request, response) => {
  try {
    const dto = parseDto(registerSchema, request.body);
    const session = await authService.register(dto.email, dto.password, getRequestClientMetadata(request));

    applySessionCookies(session.sessionToken, session.csrfToken, session.expiresAt, response);

    response.status(201).send({
      user: {
        email: dto.email,
        isEmailVerified: false
      }
    });
  } catch (error) {
    sendAuthError(response, error);
  }
});

router.post('/api/auth/login', sensitiveAuthLimiter, async (request, response) => {
  try {
    const dto = parseDto(loginSchema, request.body);
    const session = await authService.login(dto.email, dto.password, getRequestClientMetadata(request));

    applySessionCookies(session.sessionToken, session.csrfToken, session.expiresAt, response);

    const principal = await authService.getSessionPrincipalFromToken(session.sessionToken);

    response.status(200).send({
      user: {
        email: principal?.user.email,
        isEmailVerified: principal?.user.isEmailVerified
      }
    });
  } catch (error) {
    sendAuthError(response, error);
  }
});

router.post('/api/auth/logout', requireAuthenticatedUser, requireCsrf, async (request, response) => {
  try {
    const rawSessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    if (rawSessionToken) {
      await authService.logout(rawSessionToken);
    }

    clearAuthCookies(response);
    response.status(200).send({ ok: true });
  } catch (error) {
    sendAuthError(response, error);
  }
});

router.get('/api/auth/me', requireAuthenticatedUser, async (request, response) => {
  response.status(200).send({
    id: request.auth?.userId,
    email: request.auth?.email,
    isEmailVerified: request.auth?.isEmailVerified,
    roles: request.auth?.roles
  });
});

router.get('/api/auth/csrf', requireAuthenticatedUser, async (request, response) => {
  try {
    const rawSessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    if (rawSessionToken === undefined) {
      response.status(401).send({ error: 'Authentication required' });
      return;
    }

    const { csrfToken, expiresAt } = await authService.rotateCsrfToken(rawSessionToken);
    setCsrfCookie(response, csrfToken, expiresAt);

    response.status(200).send({ csrfToken });
  } catch (error) {
    sendAuthError(response, error);
  }
});

router.post('/api/auth/refresh', authLimiter, requireAuthenticatedUser, requireCsrf, async (request, response) => {
  try {
    const rawSessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    if (rawSessionToken === undefined) {
      response.status(401).send({ error: 'Authentication required' });
      return;
    }

    const rotated = await authService.rotateSession(rawSessionToken, getRequestClientMetadata(request));

    applySessionCookies(rotated.sessionToken, rotated.csrfToken, rotated.expiresAt, response);

    response.status(200).send({ ok: true });
  } catch (error) {
    sendAuthError(response, error);
  }
});

router.post('/api/auth/verify-email', sensitiveAuthLimiter, async (request, response) => {
  try {
    const dto = parseDto(verifyEmailSchema, request.body);
    await authService.verifyEmail(dto.token);
    response.status(200).send({ ok: true });
  } catch (error) {
    sendAuthError(response, error);
  }
});

router.post('/api/auth/verify-email-code', sensitiveAuthLimiter, async (request, response) => {
  try {
    const dto = parseDto(verifyEmailCodeSchema, request.body);
    await authService.verifyEmailCode(dto.email, dto.code);
    response.status(200).send({ ok: true });
  } catch (error) {
    sendAuthError(response, error);
  }
});

router.post('/api/auth/resend-verification', sensitiveAuthLimiter, attachAuthenticatedUserIfPresent, async (request, response) => {
  try {
    const dto = parseDto(resendVerificationSchema, request.body);
    const authenticatedUserId = request.auth?.userId;
    await authService.resendVerification(dto.email, authenticatedUserId);
    response.status(200).send({ message: GENERIC_IF_EXISTS_MESSAGE });
  } catch (error) {
    sendAuthError(response, error);
  }
});

router.post('/api/auth/forgot-password', sensitiveAuthLimiter, async (request, response) => {
  try {
    const dto = parseDto(forgotPasswordSchema, request.body);
    await authService.forgotPassword(dto.email);
    response.status(200).send({ message: GENERIC_IF_EXISTS_MESSAGE });
  } catch (error) {
    sendAuthError(response, error);
  }
});

router.post('/api/auth/reset-password', sensitiveAuthLimiter, async (request, response) => {
  try {
    const dto = parseDto(resetPasswordSchema, request.body);
    await authService.resetPassword(dto.token, dto.password);
    clearAuthCookies(response);
    response.status(200).send({ ok: true });
  } catch (error) {
    sendAuthError(response, error);
  }
});

router.get('/api/auth/google/start', (request: Request, response: Response) => {
  if (isGoogleOauthConfigured() === false) {
    response.status(503).send({ error: 'Google OAuth is not configured' });
    return;
  }

  const nextPath = sanitizeNextPath(typeof request.query.next === 'string' ? request.query.next : undefined);
  const oauthState = createOpaqueToken();

  response.cookie(GOOGLE_OAUTH_STATE_COOKIE_NAME, oauthState, googleOauthCookieOptions);
  response.cookie(GOOGLE_OAUTH_NEXT_COOKIE_NAME, nextPath, googleOauthCookieOptions);

  const googleParams = new URLSearchParams({
    client_id: googleOauthClientId,
    redirect_uri: googleOauthRedirectUri,
    response_type: 'code',
    scope: googleOauthScope,
    state: oauthState,
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent'
  });

  response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${googleParams.toString()}`);
});

router.get('/api/auth/google/callback', async (request: Request, response: Response) => {
  if (isGoogleOauthConfigured() === false) {
    response.status(503).send({ error: 'Google OAuth is not configured' });
    return;
  }

  const stateFromQuery = typeof request.query.state === 'string' ? request.query.state : '';
  const oauthCode = typeof request.query.code === 'string' ? request.query.code : '';
  const stateFromCookie = request.cookies?.[GOOGLE_OAUTH_STATE_COOKIE_NAME] || '';
  const nextPath = sanitizeNextPath(request.cookies?.[GOOGLE_OAUTH_NEXT_COOKIE_NAME]);

  response.clearCookie(GOOGLE_OAUTH_STATE_COOKIE_NAME, googleOauthCookieOptions);
  response.clearCookie(GOOGLE_OAUTH_NEXT_COOKIE_NAME, googleOauthCookieOptions);

  if (stateFromCookie.length === 0 || stateFromQuery.length === 0 || safeEqual(stateFromCookie, stateFromQuery) === false) {
    clearAuthCookies(response);
    response.redirect(`${appBaseUrl.replace(/\/$/, '')}/login?error=google_state_mismatch`);
    return;
  }

  if (oauthCode.length === 0) {
    clearAuthCookies(response);
    response.redirect(`${appBaseUrl.replace(/\/$/, '')}/login?error=google_auth_failed`);
    return;
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: oauthCode,
        client_id: googleOauthClientId,
        client_secret: googleOauthClientSecret,
        redirect_uri: googleOauthRedirectUri,
        grant_type: 'authorization_code'
      }),
      signal: AbortSignal.timeout(10_000)
    });

    if (!tokenResponse.ok) {
      throw new Error(`Google token exchange failed with status ${tokenResponse.status}`);
    }

    const tokenPayload = await tokenResponse.json() as { access_token?: string };
    const accessToken = tokenPayload.access_token;

    if (!accessToken) {
      throw new Error('Google token exchange returned no access token');
    }

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      signal: AbortSignal.timeout(10_000)
    });

    if (!profileResponse.ok) {
      throw new Error(`Google profile fetch failed with status ${profileResponse.status}`);
    }

    const profile = await profileResponse.json() as { email?: string; email_verified?: boolean };
    const googleEmail = profile.email;
    const googleEmailVerified = profile.email_verified === true;

    if (!googleEmail || !googleEmailVerified) {
      throw new Error('Google account does not expose a verified email');
    }

    const session = await authService.loginWithGoogle(
      googleEmail,
      googleEmailVerified,
      getRequestClientMetadata(request)
    );

    applySessionCookies(session.sessionToken, session.csrfToken, session.expiresAt, response);
    response.redirect(`${appBaseUrl.replace(/\/$/, '')}${nextPath}`);
  } catch {
    clearAuthCookies(response);
    response.redirect(`${appBaseUrl.replace(/\/$/, '')}/login?error=google_auth_failed`);
  }
});

export default router;
