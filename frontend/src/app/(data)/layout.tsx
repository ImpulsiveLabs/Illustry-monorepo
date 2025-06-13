import React from 'react';
import SiteHeader from '@/components/layouts/site-header';

type DataLayoutProps = {
  children: React.ReactNode
}

const DataLayout = ({ children }: DataLayoutProps) => (
    <div className="relative flex min-h-screen flex-col" >
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {/* <SiteFooter /> */}
    </div>
);

export default DataLayout;
