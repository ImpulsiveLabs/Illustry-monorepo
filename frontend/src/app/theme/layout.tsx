import React from 'react';
import SiteHeader from '@/components/layouts/site-header';

interface ThemeLayoutProps {
  children: React.ReactNode;
}

const ThemeLayout = ({ children }: ThemeLayoutProps) => (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
);

export default ThemeLayout;
