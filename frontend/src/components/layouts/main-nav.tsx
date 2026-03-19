'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
import ThemeToggle from './theme-toggle';
import { useActiveProject } from '../providers/active-project-provider';
import { useLocale } from '../providers/locale-provider';
import LocaleSwitcher from './locale-switcher';

type NavItem = {
  title: string;
  href?: string;
  clickableNoActiveProject?: boolean;
  disabled?: boolean;
}

type MainNavProps = {
  items?: NavItem[];
}

const MainNav = ({ items }: MainNavProps) => {
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
    <div className="hidden gap-6 lg:flex">
      <Link
        aria-label={t('common.home')}
        href="/"
        className="hidden items-center space-x-2 lg:flex"
      >
        <Icons.logo className="h-6 w-6" aria-hidden="true" />
        <span className="hidden font-bold lg:inline-block">
          {siteConfig.name}
        </span>
      </Link>
      <NavigationMenu>
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
      <div className="flex flex-1 items-center justify-end space-x-4">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </div>
  );
};

export default MainNav;
