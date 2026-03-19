'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  getMessage,
  Locale,
  resolveLocaleFromLanguage,
  SUPPORTED_LOCALES
} from '@/lib/i18n/messages';

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const STORAGE_KEY = 'illustry-locale';

const defaultLocaleContext: LocaleContextType = {
  locale: 'en',
  setLocale: () => undefined,
  t: (key: string) => getMessage('en', key)
};

const LocaleContext = createContext<LocaleContextType>(defaultLocaleContext);

const resolveInitialLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const storedLocale = window.localStorage.getItem(STORAGE_KEY);
  if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale as Locale)) {
    return storedLocale as Locale;
  }

  return resolveLocaleFromLanguage(window.navigator.language);
};

type LocaleProviderProps = {
  children: React.ReactNode;
};

const LocaleProvider = ({ children }: LocaleProviderProps) => {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const nextLocale = resolveInitialLocale();
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const contextValue = useMemo(() => ({
    locale,
    setLocale: setLocaleState,
    t: (key: string) => getMessage(locale, key)
  }), [locale]);

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
