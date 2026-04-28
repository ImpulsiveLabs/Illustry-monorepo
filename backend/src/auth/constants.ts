const DEFAULT_SESSION_TTL_MINUTES = 60 * 24;
const DEFAULT_EMAIL_VERIFY_TTL_MINUTES = 15;
const DEFAULT_PASSWORD_RESET_TTL_MINUTES = 30;
const DEFAULT_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const SESSION_COOKIE_NAME = process.env.AUTH_SESSION_COOKIE_NAME || 'illustry_sid';
const CSRF_COOKIE_NAME = process.env.AUTH_CSRF_COOKIE_NAME || 'illustry_csrf';
const GOOGLE_OAUTH_NEXT_COOKIE_NAME = process.env.GOOGLE_OAUTH_NEXT_COOKIE_NAME || 'illustry_google_next';

const isProduction = process.env.NODE_ENV === 'production';

const cookieDomain = process.env.AUTH_COOKIE_DOMAIN || undefined;
const cookieSecure = process.env.AUTH_COOKIE_SECURE
  ? process.env.AUTH_COOKIE_SECURE === 'true'
  : isProduction;

const sessionTtlMinutes = Number(process.env.AUTH_SESSION_TTL_MINUTES || DEFAULT_SESSION_TTL_MINUTES);
const emailVerificationTtlMinutes = Number(
  process.env.AUTH_EMAIL_VERIFICATION_TTL_MINUTES || DEFAULT_EMAIL_VERIFY_TTL_MINUTES
);
const passwordResetTtlMinutes = Number(
  process.env.AUTH_PASSWORD_RESET_TTL_MINUTES || DEFAULT_PASSWORD_RESET_TTL_MINUTES
);

const appBaseUrl = process.env.AUTH_APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@illustry.local';
const emailServiceUrl = process.env.EMAIL_SERVICE_URL || '';
const emailServiceApiKey = process.env.EMAIL_SERVICE_API_KEY || '';

const googleOauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '';
const googleOauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
const googleOauthRedirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || '';
const googleOauthScope = process.env.GOOGLE_OAUTH_SCOPE || 'openid email profile';
const avatarMaxBytes = Number(process.env.AUTH_AVATAR_MAX_BYTES || DEFAULT_AVATAR_MAX_BYTES);
const avatarAllowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];

const argonOptions = {
  type: 2,
  memoryCost: Number(process.env.AUTH_ARGON2_MEMORY_COST || 19456),
  timeCost: Number(process.env.AUTH_ARGON2_TIME_COST || 2),
  parallelism: Number(process.env.AUTH_ARGON2_PARALLELISM || 1)
};

const parseCorsAllowlist = (): string[] => {
  const raw = process.env.CORS_ORIGIN_ALLOWLIST;
  if (!raw) {
    return [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:4321',
      'http://127.0.0.1:4321'
    ];
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  GOOGLE_OAUTH_NEXT_COOKIE_NAME,
  cookieDomain,
  cookieSecure,
  sessionTtlMinutes,
  emailVerificationTtlMinutes,
  passwordResetTtlMinutes,
  appBaseUrl,
  fromEmail,
  emailServiceUrl,
  emailServiceApiKey,
  googleOauthClientId,
  googleOauthClientSecret,
  googleOauthRedirectUri,
  googleOauthScope,
  avatarMaxBytes,
  avatarAllowedMimeTypes,
  argonOptions,
  parseCorsAllowlist
};
