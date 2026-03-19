'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Dispatch, ReactNode, SetStateAction, useEffect, useState
} from 'react';
import siteConfig from '@/config/site';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
      'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
      pathname === href,
      disabled && 'pointer-events-none opacity-60'
    )}
    onClick={() => setIsOpen(false)}
  >
    {children}
  </Link>
);

const MobileNav = ({ items }: MobileNavProps) => {
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild suppressHydrationWarning>
        <Button
          suppressHydrationWarning
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent
          focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden"
        >
          <Icons.menu className="h-6 w-6" />
          <span className="sr-only">{t('common.toggleMenu')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pl-1 pr-0">
        <div className="px-7">
          <Link
            aria-label={t('common.home')}
            href="/"
            className="flex items-center"
            onClick={() => setIsOpen(false)}
          >
            <Icons.logo className="mr-2 h-4 w-4" aria-hidden="true" />
            <span className="font-bold">{siteConfig.name}</span>
          </Link>
        </div>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="pl-1 pr-7">
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
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
