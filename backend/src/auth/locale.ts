import { Request } from 'express';

const AUTH_EMAIL_LOCALES = ['en', 'ro'] as const;
type AuthLocale = (typeof AUTH_EMAIL_LOCALES)[number];

const normalizeAuthLocale = (candidate?: string | null): AuthLocale | undefined => {
  if (!candidate) {
    return undefined;
  }

  const normalized = candidate.toLowerCase().replace('_', '-');
  if (normalized === 'ro' || normalized.startsWith('ro-')) {
    return 'ro';
  }
  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  return undefined;
};

const resolveLocaleFromAcceptLanguage = (header?: string | null): AuthLocale => {
  if (!header) {
    return 'en';
  }

  const candidates = header
    .split(',')
    .map((entry) => entry.split(';')[0]?.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const locale = normalizeAuthLocale(candidate);
    if (locale) {
      return locale;
    }
  }

  return 'en';
};

const resolveRequestAuthLocale = (request: Request): AuthLocale => {
  const headerLocale = normalizeAuthLocale(request.header('x-illustry-locale'));
  if (headerLocale) {
    return headerLocale;
  }

  const cookieLocale = normalizeAuthLocale(request.cookies?.['illustry-locale']);
  if (cookieLocale) {
    return cookieLocale;
  }

  return resolveLocaleFromAcceptLanguage(request.header('accept-language'));
};

const AUTH_TEXT: Record<AuthLocale, Record<string, string>> = {
  en: {
    'auth.error.invalidRequestPayload': 'Invalid request payload',
    'auth.error.invalidEmailOrPassword': 'Invalid email or password',
    'auth.error.unableToRegister': 'Unable to register with provided credentials',
    'auth.error.sessionInvalid': 'Session is invalid or expired',
    'auth.error.verificationTokenInvalid': 'Verification token is invalid or expired',
    'auth.error.verificationCodeInvalid': 'Verification code is invalid or expired',
    'auth.error.passwordResetTokenInvalid': 'Password reset token is invalid or expired',
    'auth.error.authenticationRequired': 'Authentication required',
    'auth.error.avatarNotFound': 'Avatar not found',
    'auth.error.currentPasswordIncorrect': 'Current password is incorrect',
    'auth.error.googleOauthNotConfigured': 'Google OAuth is not configured',
    'auth.message.genericIfExists': 'If an account exists, an email was sent'
  },
  ro: {
    'auth.error.invalidRequestPayload': 'Payload-ul cererii este invalid',
    'auth.error.invalidEmailOrPassword': 'Email sau parola invalida',
    'auth.error.unableToRegister': 'Nu s-a putut crea contul cu datele furnizate',
    'auth.error.sessionInvalid': 'Sesiunea este invalida sau expirata',
    'auth.error.verificationTokenInvalid': 'Tokenul de verificare este invalid sau a expirat',
    'auth.error.verificationCodeInvalid': 'Codul de verificare este invalid sau a expirat',
    'auth.error.passwordResetTokenInvalid': 'Tokenul de resetare a parolei este invalid sau a expirat',
    'auth.error.authenticationRequired': 'Autentificarea este necesara',
    'auth.error.avatarNotFound': 'Avatarul nu a fost gasit',
    'auth.error.currentPasswordIncorrect': 'Parola actuala este incorecta',
    'auth.error.googleOauthNotConfigured': 'Google OAuth nu este configurat',
    'auth.message.genericIfExists': 'Daca exista un cont, a fost trimis un email'
  }
};

const AUTH_TEXT_BY_ENGLISH: Record<string, string> = {
  'Invalid request payload': 'auth.error.invalidRequestPayload',
  'Invalid email or password': 'auth.error.invalidEmailOrPassword',
  'Unable to register with provided credentials': 'auth.error.unableToRegister',
  'Session is invalid or expired': 'auth.error.sessionInvalid',
  'Verification token is invalid or expired': 'auth.error.verificationTokenInvalid',
  'Verification code is invalid or expired': 'auth.error.verificationCodeInvalid',
  'Password reset token is invalid or expired': 'auth.error.passwordResetTokenInvalid',
  'Authentication required': 'auth.error.authenticationRequired',
  'Avatar not found': 'auth.error.avatarNotFound',
  'Current password is incorrect': 'auth.error.currentPasswordIncorrect',
  'Google OAuth is not configured': 'auth.error.googleOauthNotConfigured',
  'If an account exists, an email was sent': 'auth.message.genericIfExists'
};

const translateAuthText = (locale: AuthLocale, input: string) => {
  const key = AUTH_TEXT_BY_ENGLISH[input];
  if (!key) {
    return input;
  }

  return AUTH_TEXT[locale][key] || input;
};

export {
  AUTH_EMAIL_LOCALES,
  AuthLocale,
  normalizeAuthLocale,
  resolveRequestAuthLocale,
  translateAuthText
};
