import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocaleSwitcher from '@/components/layouts/locale-switcher';
import type { Locale } from '@/lib/i18n/messages';

let currentLocale: Locale = 'en';
const setLocaleSpy = vi.fn();

vi.mock('@/components/providers/locale-provider', () => ({
  useLocale: () => ({
    locale: currentLocale,
    setLocale: setLocaleSpy,
    t: (key: string) => {
      const messages: Record<string, string> = {
        'tooltip.languageSelector': 'Change interface language',
        'common.language': 'Language',
        'common.search': 'Search...',
        'table.noResults': 'No results found.'
      };
      return messages[key] || key;
    }
  })
}));

vi.mock('@/components/ui/hint-tooltip', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    currentLocale = 'en';
    setLocaleSpy.mockClear();
  });

  it('renders only 5 locales initially and opens downward', async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher />);

    await user.click(screen.getByRole('combobox', { name: 'Language' }));

    expect(await screen.findAllByRole('option')).toHaveLength(5);

    const listbox = screen.getByRole('listbox', { name: 'Language' });
    expect(listbox.closest('[data-side="bottom"]')).toBeInTheDocument();
  });

  it('filters locales by search and selects the matching locale', async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher />);

    await user.click(screen.getByRole('combobox', { name: 'Language' }));
    await user.type(screen.getByPlaceholderText('Search...'), 'om');

    expect(screen.queryByRole('option', { name: 'Română' })).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search...'));
    await user.type(screen.getByPlaceholderText('Search...'), 'rom');

    const option = await screen.findByRole('option', { name: 'Română' });
    await user.click(option);

    expect(setLocaleSpy).toHaveBeenCalledWith('ro');
  });

  it('loads more locales when the list is scrolled to the bottom', async () => {
    const user = userEvent.setup();
    render(<LocaleSwitcher />);

    await user.click(screen.getByRole('combobox', { name: 'Language' }));
    const listbox = screen.getByRole('listbox', { name: 'Language' });

    Object.defineProperty(listbox, 'scrollTop', { value: 100, configurable: true });
    Object.defineProperty(listbox, 'clientHeight', { value: 120, configurable: true });
    Object.defineProperty(listbox, 'scrollHeight', { value: 200, configurable: true });

    fireEvent.scroll(listbox);

    await waitFor(() => {
      expect(screen.getAllByRole('option')).toHaveLength(10);
    });
  });
});
