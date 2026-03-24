'use client';

import {
  UIEvent, useEffect, useMemo, useState
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { LOCALE_LABELS, Locale, SUPPORTED_LOCALES } from '@/lib/i18n/messages';
import { useLocale } from '@/components/providers/locale-provider';
import HintTooltip from '@/components/ui/hint-tooltip';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Input from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 5;
const SCROLL_OFFSET_PX = 16;

const normalizeForSearch = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const LocaleSwitcher = () => {
  const { locale, setLocale, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredLocales = useMemo(() => {
    const normalizedQuery = normalizeForSearch(searchValue.trim());

    if (!normalizedQuery) {
      return SUPPORTED_LOCALES;
    }

    return SUPPORTED_LOCALES.filter((item) => normalizeForSearch(LOCALE_LABELS[item]).startsWith(normalizedQuery));
  }, [searchValue]);

  const visibleLocales = useMemo(
    () => filteredLocales.slice(0, visibleCount),
    [filteredLocales, visibleCount]
  );

  const hasMoreLocales = visibleCount < filteredLocales.length;

  useEffect(() => {
    if (!isOpen) {
      setSearchValue('');
      setVisibleCount(PAGE_SIZE);
    }
  }, [isOpen]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchValue]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMoreLocales) {
      return;
    }

    const target = event.currentTarget;
    const hasReachedEnd = target.scrollTop + target.clientHeight >= target.scrollHeight - SCROLL_OFFSET_PX;

    if (hasReachedEnd) {
      setVisibleCount((previous) => Math.min(previous + PAGE_SIZE, filteredLocales.length));
    }
  };

  const handleSelectLocale = (selectedLocale: Locale) => {
    setLocale(selectedLocale);
    setIsOpen(false);
  };

  return (
    <HintTooltip text={t('tooltip.languageSelector')}>
      <div className="w-[170px]">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              aria-label={t('common.language')}
              role="combobox"
              aria-expanded={isOpen}
              className="h-8 w-full justify-between px-2 text-xs font-normal"
            >
              <span className="truncate">{LOCALE_LABELS[locale]}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="start"
            avoidCollisions={false}
            className="w-[240px] p-0"
          >
            <div className="border-b p-2">
              <Input
                aria-label={t('common.language')}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={t('common.search')}
                className="h-8 text-xs"
              />
            </div>
            <div
              role="listbox"
              aria-label={t('common.language')}
              className="h-36 overflow-y-auto p-1"
              onScroll={handleScroll}
            >
              {visibleLocales.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={locale === item}
                  className={cn(
                    'flex w-full items-center rounded-sm px-2 py-2 text-left text-xs',
                    'hover:bg-accent hover:text-accent-foreground',
                    locale === item && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => handleSelectLocale(item)}
                >
                  <span className="truncate">{LOCALE_LABELS[item]}</span>
                  <Check
                    className={cn(
                      'ml-auto h-3.5 w-3.5',
                      locale === item ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </button>
              ))}
              {filteredLocales.length === 0 && (
                <p className="px-2 py-4 text-xs text-muted-foreground">{t('table.noResults')}</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </HintTooltip>
  );
};

export default LocaleSwitcher;
