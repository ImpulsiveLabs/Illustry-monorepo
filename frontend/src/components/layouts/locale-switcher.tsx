'use client';

import { LOCALE_LABELS, Locale, SUPPORTED_LOCALES } from '@/lib/i18n/messages';
import { useLocale } from '@/components/providers/locale-provider';

const LocaleSwitcher = () => {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="w-[130px]">
      <label htmlFor="locale-switcher" className="sr-only">
        {t('common.language')}
      </label>
      <select
        id="locale-switcher"
        aria-label={t('common.language')}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
      >
        {SUPPORTED_LOCALES.map((item) => (
          <option key={item} value={item}>
            {LOCALE_LABELS[item]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocaleSwitcher;
