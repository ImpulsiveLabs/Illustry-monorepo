'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { CurrentUser } from '@/lib/auth-user';
import siteConfig from '@/config/site';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import Icons from '@/components/icons';
import HintTooltip from '@/components/ui/hint-tooltip';
import { useActiveProject } from '../providers/active-project-provider';
import { useLocale } from '../providers/locale-provider';
import LocaleSwitcher from './locale-switcher';
import ThemeToggle from './theme-toggle';
import UserNav from './user-nav';

type NavItem = {
  title: string;
  href?: string;
  clickableNoActiveProject?: boolean;
  disabled?: boolean;
};

type MainNavProps = {
  items?: NavItem[];
  user: CurrentUser;
};

const MainNav = ({ items, user }: MainNavProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname() || '';
  const activeProject = useActiveProject();
  const { t } = useLocale();

  const getNavigationLabel = (item: NavItem) => {
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

  if (!isMounted) {
    return <Icons.spinner className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />;
  }

  return (
    <div className="hidden w-full items-center lg:flex">
      <div className="flex shrink-0 items-center">
        <HintTooltip text={t('tooltip.home')}>
          <Link
            aria-label={t('common.home')}
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-1 py-2 transition-opacity hover:opacity-85"
          >
            <Icons.logo className="h-7 w-7 text-primary" aria-hidden="true" />
            <span className="text-base font-semibold tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </Link>
        </HintTooltip>
      </div>
      <div className="flex min-w-0 flex-1 justify-center px-6">
        <NavigationMenu className="min-w-0 max-w-full">
          <NavigationMenuList className="gap-1">
            {items?.map((item) => {
              const isDisabled = !activeProject && !item.clickableNoActiveProject;
              const isActive = Boolean(
                item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))
              );
              return (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href ? item.href : '/'}
                      aria-disabled={isDisabled}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        'rounded-lg px-4 font-medium text-muted-foreground transition-colors',
                        'hover:bg-muted hover:text-foreground',
                        isActive && 'bg-accent text-accent-foreground shadow-none hover:bg-accent hover:text-accent-foreground',
                        isDisabled && 'pointer-events-none opacity-50'
                      )}
                    >
                      {getNavigationLabel(item)}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
        <UserNav email={user.email} name={user.name} avatarUrl={user.avatarUrl} />
      </div>
    </div>
  );
};

export default MainNav;
