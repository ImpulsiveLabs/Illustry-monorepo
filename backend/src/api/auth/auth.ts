import { NextFunction, Request, Response } from 'express';
import { createHmac } from 'crypto';
import { ZodError } from 'zod';
import Factory from '../../factory';
import { clearAuthCookies, setCsrfCookie, setSessionCookie } from '../../auth/cookies';
import {
  appBaseUrl,
  cookieDomain,
  cookieSecure,
  GOOGLE_OAUTH_NEXT_COOKIE_NAME,
  googleOauthClientId,
  googleOauthClientSecret,
  googleOauthRedirectUri,
  googleOauthScope,
  SESSION_COOKIE_NAME
} from '../../auth/constants';
import { createOpaqueToken, safeEqual } from '../../auth/crypto';
import { AuthHttpError, GENERIC_IF_EXISTS_MESSAGE } from '../../auth/errors';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  parseDto,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailCodeSchema,
  verifyEmailSchema
} from '../../auth/validation';
import { getRequestClientMetadata } from '../../auth/middleware';
import { resolveRequestAuthLocale, translateAuthText } from '../../auth/locale';
import { AuthAvatarUpload, AuthPublicUser } from '../../auth/types';
import { getExternalHttpTimeoutMs } from '../../config/timeouts';

const googleOauthCookieOptions = {
  path: '/',
  secure: cookieSecure,
  sameSite: 'lax' as const,
  domain: cookieDomain,
  httpOnly: true,
  maxAge: 10 * 60 * 1000
};

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

const signGoogleOauthStateNonce = (nonce: string) => (
  createHmac('sha256', googleOauthClientSecret)
    .update(`google-oauth-state:${nonce}`, 'utf8')
    .digest('base64url')
);

const createGoogleOauthState = () => {
  const nonce = createOpaqueToken();
  return `${nonce}.${signGoogleOauthStateNonce(nonce)}`;
};

const verifyGoogleOauthState = (state: string): boolean => {
  const [nonce, signature, extra] = state.split('.');

  if (!nonce || !signature || extra !== undefined) {
    return false;
  }

  return safeEqual(signature, signGoogleOauthStateNonce(nonce));
};

const sendAuthError = (response: Response, next: NextFunction, error: unknown, locale = 'en') => {
  if (error instanceof AuthHttpError) {
    response.status(error.statusCode).send({ error: translateAuthText(locale as any, error.message) });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).send({ error: translateAuthText(locale as any, 'Invalid request payload') });
    return;
  }

  next(error as Error);
};

const extractAvatarUpload = (request: Request): AuthAvatarUpload | undefined => {
  const files = request.files as Record<string, Express.Multer.File[] | undefined> | undefined;
  const avatarFile = files?.avatar?.[0];

  if (!avatarFile) {
    return undefined;
  }

  return {
    fileName: avatarFile.originalname,
    contentType: avatarFile.mimetype,
    size: avatarFile.size,
    data: avatarFile.buffer
  };
};

const getCurrentUserResponse = (request: Request): AuthPublicUser => ({
  id: request.auth?.userId || '',
  email: request.auth?.email || '',
  name: request.auth?.name || '',
  isEmailVerified: request.auth?.isEmailVerified === true,
  roles: request.auth?.roles || [],
  hasAvatar: request.auth?.hasAvatar === true,
  avatarUpdatedAt: request.auth?.avatarUpdatedAt
});

const register = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = parseDto(registerSchema, request.body);
    const session = await Factory.getInstance().getBZL().AuthBZL.register(
      dto.email,
      dto.password,
      dto.name,
      extractAvatarUpload(request),
      getRequestClientMetadata(request),
      resolveRequestAuthLocale(request)
    );

    applySessionCookies(session.sessionToken, session.csrfToken, session.expiresAt, response);

    const principal = await Factory.getInstance().getBZL().AuthBZL.getSessionPrincipalFromToken(session.sessionToken);

    response.status(201).send({
      user: principal
        ? Factory.getInstance().getBZL().AuthBZL.toPublicUser(principal.user)
        : null
    });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const login = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = parseDto(loginSchema, request.body);
    const session = await Factory.getInstance().getBZL().AuthBZL.login(
      dto.email,
      dto.password,
      getRequestClientMetadata(request)
    );

    applySessionCookies(session.sessionToken, session.csrfToken, session.expiresAt, response);

    const principal = await Factory.getInstance().getBZL().AuthBZL.getSessionPrincipalFromToken(session.sessionToken);

    response.status(200).send({
      user: principal
        ? Factory.getInstance().getBZL().AuthBZL.toPublicUser(principal.user)
        : null
    });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const logout = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawSessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    if (rawSessionToken) {
      await Factory.getInstance().getBZL().AuthBZL.logout(rawSessionToken);
    }

    clearAuthCookies(response);
    response.status(200).send({ ok: true });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const me = async (
  request: Request,
  response: Response
): Promise<void> => {
  response.status(200).send(getCurrentUserResponse(request));
};

const getThemeConfig = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).send({ error: translateAuthText(resolveRequestAuthLocale(request), 'Authentication required') });
      return;
    }

    const themeConfig = await Factory.getInstance().getBZL().AuthBZL.getThemeConfig(userId);
    response.status(200).send({ themeConfig });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const updateThemeConfig = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).send({ error: translateAuthText(resolveRequestAuthLocale(request), 'Authentication required') });
      return;
    }

    const themePayload = request.body?.themeConfig;
    if (!themePayload || typeof themePayload !== 'object' || Array.isArray(themePayload)) {
      response.status(400).send({ error: 'A valid themeConfig payload is required' });
      return;
    }

    const themeConfig = await Factory.getInstance().getBZL().AuthBZL.updateThemeConfig(
      userId,
      themePayload as Record<string, unknown>
    );
    response.status(200).send({ themeConfig });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const resetThemeConfig = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).send({ error: translateAuthText(resolveRequestAuthLocale(request), 'Authentication required') });
      return;
    }

    const themeConfig = await Factory.getInstance().getBZL().AuthBZL.resetThemeConfig(userId);
    response.status(200).send({ themeConfig });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const meAvatar = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).send({ error: translateAuthText(resolveRequestAuthLocale(request), 'Authentication required') });
      return;
    }

    const avatar = await Factory.getInstance().getBZL().AuthBZL.getUserAvatar(userId);

    if (!avatar) {
      response.status(404).send({ error: translateAuthText(resolveRequestAuthLocale(request), 'Avatar not found') });
      return;
    }

    response.setHeader('Cache-Control', 'private, max-age=300');
    response.contentType(avatar.contentType);
    response.send(avatar.data);
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const csrf = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawSessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    if (rawSessionToken === undefined) {
      response.status(401).send({ error: translateAuthText(resolveRequestAuthLocale(request), 'Authentication required') });
      return;
    }

    const { csrfToken, expiresAt } = await Factory.getInstance().getBZL().AuthBZL.rotateCsrfToken(rawSessionToken);
    setCsrfCookie(response, csrfToken, expiresAt);

    response.status(200).send({ csrfToken });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const updateProfile = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).send({ error: translateAuthText(resolveRequestAuthLocale(request), 'Authentication required') });
      return;
    }

    const dto = parseDto(updateProfileSchema, request.body);
    const user = await Factory.getInstance().getBZL().AuthBZL.updateProfile(
      userId,
      {
        name: dto.name,
        avatar: extractAvatarUpload(request),
        removeAvatar: dto.removeAvatar === 'true'
      }
    );

    response.status(200).send({ user });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const changePassword = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = request.auth?.userId;

    if (!userId) {
      response.status(401).send({ error: translateAuthText(resolveRequestAuthLocale(request), 'Authentication required') });
      return;
    }

    const dto = parseDto(changePasswordSchema, request.body);

    await Factory.getInstance().getBZL().AuthBZL.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword
    );

    response.status(200).send({ ok: true });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const refresh = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawSessionToken = request.cookies?.[SESSION_COOKIE_NAME];

    if (rawSessionToken === undefined) {
      response.status(401).send({ error: translateAuthText(resolveRequestAuthLocale(request), 'Authentication required') });
      return;
    }

    const rotated = await Factory.getInstance().getBZL().AuthBZL.rotateSession(
      rawSessionToken,
      getRequestClientMetadata(request)
    );

    applySessionCookies(rotated.sessionToken, rotated.csrfToken, rotated.expiresAt, response);
    response.status(200).send({ ok: true });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const verifyEmail = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = parseDto(verifyEmailSchema, request.body);
    await Factory.getInstance().getBZL().AuthBZL.verifyEmail(dto.token);
    response.status(200).send({ ok: true });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const verifyEmailCode = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = parseDto(verifyEmailCodeSchema, request.body);
    await Factory.getInstance().getBZL().AuthBZL.verifyEmailCode(dto.email, dto.code);
    response.status(200).send({ ok: true });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const resendVerification = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = parseDto(resendVerificationSchema, request.body);
    const locale = resolveRequestAuthLocale(request);
    await Factory.getInstance().getBZL().AuthBZL.resendVerification(dto.email, request.auth?.userId, locale);
    response.status(200).send({ message: translateAuthText(locale, GENERIC_IF_EXISTS_MESSAGE) });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const forgotPassword = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = parseDto(forgotPasswordSchema, request.body);
    const locale = resolveRequestAuthLocale(request);
    await Factory.getInstance().getBZL().AuthBZL.forgotPassword(dto.email, locale);
    response.status(200).send({ message: translateAuthText(locale, GENERIC_IF_EXISTS_MESSAGE) });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const resetPassword = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dto = parseDto(resetPasswordSchema, request.body);
    await Factory.getInstance().getBZL().AuthBZL.resetPassword(dto.token, dto.password);
    clearAuthCookies(response);
    response.status(200).send({ ok: true });
  } catch (error) {
    sendAuthError(response, next, error, resolveRequestAuthLocale(request));
  }
};

const googleStart = (
  request: Request,
  response: Response
): void => {
  if (isGoogleOauthConfigured() === false) {
    response.status(503).send({ error: translateAuthText(resolveRequestAuthLocale(request), 'Google OAuth is not configured') });
    return;
  }

  const nextPath = sanitizeNextPath(typeof request.query.next === 'string' ? request.query.next : undefined);
  const oauthState = createGoogleOauthState();

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
};

const googleCallback = async (
  request: Request,
  response: Response
): Promise<void> => {
  if (isGoogleOauthConfigured() === false) {
    response.status(503).send({ error: translateAuthText(resolveRequestAuthLocale(request), 'Google OAuth is not configured') });
    return;
  }

  const stateFromQuery = typeof request.query.state === 'string' ? request.query.state : '';
  const oauthCode = typeof request.query.code === 'string' ? request.query.code : '';
  const nextPath = sanitizeNextPath(request.cookies?.[GOOGLE_OAUTH_NEXT_COOKIE_NAME]);

  response.clearCookie(GOOGLE_OAUTH_NEXT_COOKIE_NAME, googleOauthCookieOptions);

  if (
    stateFromQuery.length === 0
    || verifyGoogleOauthState(stateFromQuery) === false
  ) {
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
      signal: AbortSignal.timeout(getExternalHttpTimeoutMs())
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
      signal: AbortSignal.timeout(getExternalHttpTimeoutMs())
    });

    if (!profileResponse.ok) {
      throw new Error(`Google profile fetch failed with status ${profileResponse.status}`);
    }

    const profile = await profileResponse.json() as {
      email?: string;
      email_verified?: boolean;
      name?: string;
    };

    if (!profile.email || profile.email_verified !== true) {
      throw new Error('Google account does not expose a verified email');
    }

    const session = await Factory.getInstance().getBZL().AuthBZL.loginWithGoogle(
      profile.email,
      profile.name || profile.email.split('@')[0],
      true,
      getRequestClientMetadata(request),
      resolveRequestAuthLocale(request)
    );

    applySessionCookies(session.sessionToken, session.csrfToken, session.expiresAt, response);
    response.redirect(`${appBaseUrl.replace(/\/$/, '')}${nextPath}`);
  } catch (error) {
    clearAuthCookies(response);
    response.redirect(`${appBaseUrl.replace(/\/$/, '')}/login?error=google_auth_failed`);
  }
};

export {
  register,
  login,
  logout,
  me,
  getThemeConfig,
  updateThemeConfig,
  resetThemeConfig,
  meAvatar,
  csrf,
  updateProfile,
  changePassword,
  refresh,
  verifyEmail,
  verifyEmailCode,
  resendVerification,
  forgotPassword,
  resetPassword,
  googleStart,
  googleCallback
};
