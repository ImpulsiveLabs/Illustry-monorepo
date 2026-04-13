'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CurrentUser } from '@/app/_actions/auth';
import siteConfig from '@/config/site';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
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
}

type MainNavProps = {
  items?: NavItem[];
  user: CurrentUser;
}

const MainNav = ({ items, user }: MainNavProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const activeProject = useActiveProject();
  const { t } = useLocale();

  const getNavigationLabel = (item: NavItem) => {
    const hrefMap: Record<string, string> = {
      '/projects': 'nav.projects',
      '/visualizations': 'nav.visualizations',
      '/dashboards': 'nav.dashboards',
      '/theme': 'nav.theme',
      '/playground': 'nav.playground'
    };

    const key = item.href ? hrefMap[item.href] : undefined;
    return key ? t(key) : item.title;
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) {
    return <Icons.spinner
    className="mr-2 h-4 w-4 animate-spin"
    aria-hidden="true"
  />;
  }
  return (
    <div className="hidden w-full items-center lg:flex">
      <div className="flex shrink-0 items-center">
        <HintTooltip text={t('tooltip.home')}>
          <Link
            aria-label={t('common.home')}
            href="/"
            className="flex items-center gap-2 px-0 py-2 transition-colors hover:opacity-80"
          >
            <Icons.logo className="h-6 w-6" aria-hidden="true" />
            <span className="font-bold tracking-tight">
              {siteConfig.name}
            </span>
          </Link>
        </HintTooltip>
      </div>
      <div className="flex min-w-0 flex-1 justify-center px-6">
        <NavigationMenu className="min-w-0 max-w-full">
          <NavigationMenuList>
            {items?.map((item) => {
              const isDisabled = !activeProject && !item.clickableNoActiveProject;
              return (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={item.href ? item.href : '/'}
                      aria-disabled={isDisabled}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        isDisabled ? 'pointer-events-none opacity-50' : ''
                      )}
                    >
                      <NavigationMenuTrigger className="h-auto capitalize">
                        {getNavigationLabel(item)}
                      </NavigationMenuTrigger>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="ml-auto flex shrink-0 items-center justify-end gap-3">
        <LocaleSwitcher />
        <ThemeToggle />
        <UserNav email={user.email} name={user.name} avatarUrl={user.avatarUrl} />
      </div>
    </div>
  );
};

export default MainNav;
