'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/providers/locale-provider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import ThemeShell from '@/components/shells/theme-shell';

type UserNavProps = {
  email: string;
  name: string;
  avatarUrl?: string;
};

const getInitials = (name: string, email: string) => {
  const source = name.trim() || email;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const UserNav = ({ email, name, avatarUrl }: UserNavProps) => {
  const { t } = useLocale();
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            aria-label={t('auth.userMenu.account')}
            className="h-10 w-10 rounded-full p-0 text-[hsl(var(--illustry-header-icon))] hover:bg-[hsl(var(--illustry-header-hover-background))]"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${name} avatar`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--illustry-header-active-background))] text-sm font-semibold text-[hsl(var(--illustry-header-active-foreground))]">
                {getInitials(name, email)}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 border-[hsl(var(--illustry-header-menu-border))] bg-[hsl(var(--illustry-header-menu-background))] text-[hsl(var(--illustry-header-menu-foreground))]"
        >
          <DropdownMenuLabel className="space-y-1">
            <div className="truncate text-sm font-medium">{name}</div>
            <div className="truncate text-xs font-normal text-[hsl(var(--illustry-header-muted-foreground))]">{email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="focus:bg-[hsl(var(--illustry-header-menu-hover-background))]">
            <Link href="/account">{t('auth.userMenu.account')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="focus:bg-[hsl(var(--illustry-header-menu-hover-background))]">
            <Link href="/account/edit">{t('auth.userMenu.editProfile')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="focus:bg-[hsl(var(--illustry-header-menu-hover-background))]"
            onSelect={(event) => {
              event.preventDefault();
              setIsThemeDialogOpen(true);
            }}
          >
            {t('theme.settingsTitle')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="focus:bg-[hsl(var(--illustry-header-menu-hover-background))]">
            <Link href="/logout">{t('auth.userMenu.logout')}</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isThemeDialogOpen && (
        <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
          <DialogContent className="max-h-[92vh] max-w-[min(1280px,calc(100vw-2rem))] overflow-hidden p-0">
            <DialogHeader className="border-b px-5 py-4">
              <DialogTitle>{t('theme.settingsTitle')}</DialogTitle>
              <DialogDescription>{t('theme.settingsDescription')}</DialogDescription>
            </DialogHeader>
            <ThemeShell embedded />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default UserNav;
