'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Dispatch, ReactNode, SetStateAction, useEffect, useState
} from 'react';
import type { CurrentUser } from '@/lib/auth-user';
import siteConfig from '@/config/site';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import HintTooltip from '@/components/ui/hint-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Icons from '@/components/icons';
import ThemeToggle from './theme-toggle';
import { useActiveProject } from '../providers/active-project-provider';
import { useLocale } from '../providers/locale-provider';
import LocaleSwitcher from './locale-switcher';

type NavItem = {
  title: string;
  href?: string;
  clickableNoActiveProject?: boolean;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
}

type NavItemWithChildren = {
  items: NavItemWithChildren[];
} & NavItem

type NavItemWithOptionalChildren = {
  items?: NavItemWithChildren[];
} & NavItem
type MainNavItem = NavItemWithOptionalChildren;
type MobileNavProps = {
  items?: MainNavItem[];
  user: CurrentUser;
}

type MobileLinkProps = {
  children?: ReactNode;
  href: string;
  disabled?: boolean;
  pathname: string;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const MobileLink = ({
  children,
  href,
  disabled,
  pathname,
  setIsOpen
}: MobileLinkProps) => (
  <Link
    href={href}
    className={cn(
      'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors',
      'text-[hsl(var(--illustry-sidebar-foreground))]',
      'hover:bg-[hsl(var(--illustry-sidebar-hover-background))] hover:text-[hsl(var(--illustry-sidebar-hover-foreground))]',
      'focus:bg-[hsl(var(--illustry-sidebar-hover-background))] focus:text-[hsl(var(--illustry-sidebar-hover-foreground))]',
      pathname === href && 'bg-[hsl(var(--illustry-sidebar-active-background))] text-[hsl(var(--illustry-sidebar-active-foreground))]',
      disabled && 'pointer-events-none opacity-60'
    )}
    onClick={() => setIsOpen(false)}
  >
    {children}
  </Link>
);

const MobileNav = ({ items, user }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const activeProject = useActiveProject();
  const { t } = useLocale();

  const getNavigationLabel = (item: MainNavItem) => {
    const hrefMap: Record<string, string> = {
      '/projects': 'nav.projects',
      '/visualizations': 'nav.visualizations',
      '/dashboards': 'nav.dashboards',
      '/playground': 'nav.playground'
    };

    const key = item.href ? hrefMap[item.href] : undefined;
    return key ? t(key) : item.title;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const desktopMedia = window.matchMedia('(min-width: 1024px)');
    const closeIfDesktop = () => {
      if (desktopMedia.matches) {
        setIsOpen(false);
      }
    };

    const mediaListener = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsOpen(false);
      }
    };

    closeIfDesktop();
    window.addEventListener('resize', closeIfDesktop);
    if (typeof desktopMedia.addEventListener === 'function') {
      desktopMedia.addEventListener('change', mediaListener);
    } else {
      desktopMedia.addListener(mediaListener);
    }

    return () => {
      window.removeEventListener('resize', closeIfDesktop);
      if (typeof desktopMedia.removeEventListener === 'function') {
        desktopMedia.removeEventListener('change', mediaListener);
      } else {
        desktopMedia.removeListener(mediaListener);
      }
    };
  }, []);

  if (!isMounted) {
    return <Icons.spinner
      className="mr-2 h-4 w-4 animate-spin"
      aria-hidden="true"
    />;
  }
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex w-full items-center lg:hidden">
        <HintTooltip text={t('tooltip.toggleMenu')}>
          <div>
            <SheetTrigger asChild suppressHydrationWarning>
            <Button
              suppressHydrationWarning
              aria-label={t('common.toggleMenu')}
              variant="ghost"
              className="mr-2 px-0 text-base text-[hsl(var(--illustry-header-icon))] hover:bg-transparent focus-visible:bg-transparent
              focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <Icons.menu className="h-6 w-6" />
              <span className="sr-only">{t('common.toggleMenu')}</span>
            </Button>
            </SheetTrigger>
          </div>
        </HintTooltip>
        <HintTooltip text={t('tooltip.home')}>
          <Link
            aria-label={t('common.home')}
            href="/"
            className="ml-auto flex items-center gap-2 px-0 py-2 text-right transition-colors hover:opacity-80"
          >
            <Icons.logo className="h-5 w-5 text-[hsl(var(--illustry-header-icon))]" aria-hidden="true" />
            <span className="text-sm font-bold tracking-tight">{siteConfig.name}</span>
          </Link>
        </HintTooltip>
      </div>
      <SheetContent
        side="left"
        className="border-[hsl(var(--illustry-sidebar-border))] bg-[hsl(var(--illustry-sidebar-background))] pl-1 pr-0 text-[hsl(var(--illustry-sidebar-foreground))]"
      >
        <div className="px-7">
          <HintTooltip text={t('tooltip.home')}>
            <Link
              aria-label={t('common.home')}
              href="/"
              className="flex items-center text-[hsl(var(--illustry-sidebar-foreground))]"
              onClick={() => setIsOpen(false)}
            >
              <Icons.logo className="mr-2 h-4 w-4 text-[hsl(var(--illustry-sidebar-icon))]" aria-hidden="true" />
              <span className="font-bold">{siteConfig.name}</span>
            </Link>
          </HintTooltip>
        </div>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="pl-1 pr-7">
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-[hsl(var(--illustry-sidebar-border))] bg-[hsl(var(--illustry-sidebar-menu-background))] px-3 py-3 text-[hsl(var(--illustry-sidebar-menu-foreground))]">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`${user.name} avatar`}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--illustry-sidebar-active-background))] text-sm font-semibold text-[hsl(var(--illustry-sidebar-active-foreground))]">
                  {(user.name || user.email)
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part.charAt(0).toUpperCase())
                    .join('')}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-[hsl(var(--illustry-sidebar-muted-foreground))]">{user.email}</p>
              </div>
            </div>
            {items?.map((item) => (
              <MobileLink
                key={item.title}
                href={item.href ? item.href : '/'}
                pathname={pathname}
                setIsOpen={setIsOpen}
                disabled={!activeProject && !item.clickableNoActiveProject}
              >
                {getNavigationLabel(item)}
              </MobileLink>
            ))}
            <div className="mt-4 flex items-center gap-3 px-3">
              <div className="min-w-0 flex-1">
                <LocaleSwitcher />
              </div>
              <ThemeToggle />
            </div>
            <MobileLink
              href="/logout"
              pathname={pathname}
              setIsOpen={setIsOpen}
            >
              {t('auth.userMenu.logout')}
            </MobileLink>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
