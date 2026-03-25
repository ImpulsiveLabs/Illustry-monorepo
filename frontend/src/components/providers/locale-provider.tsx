'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState
} from 'react';
import {
  COUNTRY_COOKIE_KEY,
  getMessage,
  Locale,
  LOCALE_COOKIE_KEY,
  normalizeLocale,
  resolveLocaleFromCountry,
  resolveLocaleFromLanguage,
  SUPPORTED_LOCALES,
  isRtlLocale
} from '@/lib/i18n/messages';

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const STORAGE_KEY = LOCALE_COOKIE_KEY;

const defaultLocaleContext: LocaleContextType = {
  locale: 'en',
  setLocale: () => undefined,
  t: (key: string) => getMessage('en', key)
};

const LocaleContext = createContext<LocaleContextType>(defaultLocaleContext);

const getCookie = (key: string): string | undefined => {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const cookiePrefix = `${key}=`;
  const cookiePair = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(cookiePrefix));

  if (!cookiePair) {
    return undefined;
  }

  const value = cookiePair.slice(cookiePrefix.length);
  return decodeURIComponent(value);
};

const setCookie = (key: string, value: string) => {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${key}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
};

const resolveInitialLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const storedLocale = window.localStorage.getItem(STORAGE_KEY);
  const normalizedStored = normalizeLocale(storedLocale);
  if (normalizedStored && SUPPORTED_LOCALES.includes(normalizedStored)) {
    return normalizedStored;
  }

  const cookieLocale = normalizeLocale(getCookie(LOCALE_COOKIE_KEY));
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  const countryLocale = resolveLocaleFromCountry(getCookie(COUNTRY_COOKIE_KEY));
  if (countryLocale) {
    return countryLocale;
  }

  const browserLanguages = window.navigator.languages || [window.navigator.language];
  for (const language of browserLanguages) {
    const locale = resolveLocaleFromLanguage(language);
    if (SUPPORTED_LOCALES.includes(locale)) {
      return locale;
    }
  }
  return 'en';
};

type LocaleProviderProps = {
  children: React.ReactNode;
};

const LocaleProvider = ({ children }: LocaleProviderProps) => {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [hasResolvedInitialLocale, setHasResolvedInitialLocale] = useState(false);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    const initialLocale = resolveInitialLocale();
    setLocaleState(initialLocale);
    setHasResolvedInitialLocale(true);
  }, []);

  useEffect(() => {
    if (!hasResolvedInitialLocale) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, locale);
    setCookie(LOCALE_COOKIE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
  }, [locale, hasResolvedInitialLocale]);

  const contextValue = useMemo(() => ({
    locale,
    setLocale,
    t: (key: string) => getMessage(locale, key)
  }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
};

const useLocale = () => useContext(LocaleContext);

export {
  LocaleProvider,
  useLocale
};
