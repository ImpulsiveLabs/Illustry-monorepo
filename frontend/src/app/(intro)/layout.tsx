import React from 'react';
import SiteHeader from '@/components/layouts/site-header';

type IntroLayoutProps = {
  children: React.ReactNode
}

const IntroLayout = ({ children }: IntroLayoutProps) => (
  <div className="relative flex min-h-screen flex-col">
    <SiteHeader />
    <main className="flex-1">{children}</main>
    {/* <SiteFooter /> */}
  </div>
);

export default IntroLayout;
