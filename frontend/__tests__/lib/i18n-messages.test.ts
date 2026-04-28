import {
  AUTH_BASE_MESSAGES,
  AUTH_MESSAGES
} from '@/lib/i18n/auth-messages';
import {
  EXTENDED_BASE_MESSAGES,
  EXTENDED_MESSAGES
} from '@/lib/i18n/extended-messages';
import {
  PRESET_BASE_MESSAGES,
  PRESET_MESSAGES
} from '@/lib/i18n/preset-messages';
import { SUPPORTED_LOCALES } from '@/lib/i18n/messages';

const expectLocaleCoverage = (
  bundleName: string,
  baseMessages: Record<string, string>,
  localizedMessages: Record<string, Record<string, string>>
) => {
  const baseKeys = Object.keys(baseMessages);

  for (const locale of SUPPORTED_LOCALES) {
    const localeMessages = localizedMessages[locale];

    expect(localeMessages, `${bundleName} is missing locale ${locale}`).toBeDefined();

    const missingKeys = baseKeys.filter((key) => !localeMessages?.[key]);
    expect(missingKeys, `${bundleName}/${locale} is missing message keys`).toEqual([]);
  }
};

describe('i18n message coverage', () => {
  it('keeps every message bundle populated for every supported locale', () => {
    expectLocaleCoverage('auth', AUTH_BASE_MESSAGES, AUTH_MESSAGES);
    expectLocaleCoverage('extended', EXTENDED_BASE_MESSAGES, EXTENDED_MESSAGES);
    expectLocaleCoverage('preset', PRESET_BASE_MESSAGES, PRESET_MESSAGES);
  });
});
