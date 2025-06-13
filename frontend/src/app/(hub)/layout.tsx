import React from 'react';
import SiteHeader from '@/components/layouts/site-header';

type HubLayoutProps = {
  children: React.ReactNode;
}

const HubLayout = ({ children }: HubLayoutProps) => (
    <>
      <div className="relative flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        {/* <SiteFooter /> */}
      </div>
    </>
);

export default HubLayout;
