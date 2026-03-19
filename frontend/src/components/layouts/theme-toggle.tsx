'use client';

import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Icons from '@/components/icons';
import { useLocale } from '@/components/providers/locale-provider';

const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const { t } = useLocale();

  return (
    <Button
      suppressHydrationWarning
      variant="ghost"
      size="icon"
      onClick={() => {
        router.refresh();
        return setTheme(theme === 'light' ? 'dark' : 'light');
      }}
    >
      <Icons.sun
        className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      <Icons.moon
        className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
      <span className="sr-only">{t('common.toggleTheme')}</span>
    </Button>
  );
};

export default ThemeToggle;
