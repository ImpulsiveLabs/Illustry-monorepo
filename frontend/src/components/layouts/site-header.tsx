import React from 'react';
import siteConfig from '@/config/site';
import type { CurrentUser } from '@/lib/auth-user';
import MainNav from './main-nav';
import MobileNav from './mobile-nav';

type SiteHeaderProps = {
  user: CurrentUser;
};

const SiteHeader = ({ user }: SiteHeaderProps) => (
    <header className="sticky top-0 z-40 w-full border-b border-[hsl(var(--illustry-header-border))] bg-[hsl(var(--illustry-header-background))] text-[hsl(var(--illustry-header-foreground))]">
      <div className="container flex h-16 items-center">
        <MainNav items={siteConfig.mainNav} user={user} />
        <MobileNav
          items={siteConfig.mainNav}
          user={user}
        />
      </div>
    </header>
);

export default SiteHeader;
