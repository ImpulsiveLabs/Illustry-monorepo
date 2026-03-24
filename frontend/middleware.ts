import { NextRequest, NextResponse } from 'next/server';
import {
  COUNTRY_COOKIE_KEY,
  LOCALE_COOKIE_KEY,
  normalizeLocale,
  resolveLocaleFromCountry,
  resolveLocaleFromLanguage
} from './src/lib/i18n/messages';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const resolveLocaleFromAcceptLanguage = (acceptLanguage?: string | null) => {
  if (!acceptLanguage) {
    return 'en';
  }

  const languageTokens = acceptLanguage
    .split(',')
    .map((token) => token.trim().split(';')[0])
    .filter(Boolean);

  for (const languageToken of languageTokens) {
    const locale = resolveLocaleFromLanguage(languageToken);
    if (locale) {
      return locale;
    }
  }

  return 'en';
};

const getCountryCode = (request: NextRequest) => (
  request.headers.get('x-vercel-ip-country')
  || request.headers.get('cf-ipcountry')
  || null
);

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isHttps = request.nextUrl.protocol === 'https:';

  const localeFromCookie = normalizeLocale(request.cookies.get(LOCALE_COOKIE_KEY)?.value);
  const countryCode = getCountryCode(request);
  const localeFromCountry = resolveLocaleFromCountry(countryCode);
  const localeFromBrowser = resolveLocaleFromAcceptLanguage(request.headers.get('accept-language'));
  const resolvedLocale = localeFromCookie || localeFromCountry || localeFromBrowser;

  if (countryCode) {
    response.cookies.set(COUNTRY_COOKIE_KEY, countryCode, {
      path: '/',
      maxAge: ONE_YEAR_SECONDS,
      sameSite: 'lax',
      secure: isHttps
    });
  }

  if (!localeFromCookie) {
    response.cookies.set(LOCALE_COOKIE_KEY, resolvedLocale, {
      path: '/',
      maxAge: ONE_YEAR_SECONDS,
      sameSite: 'lax',
      secure: isHttps
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.ico|.*\\..*).*)'
  ]
};
