import React from 'react';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/layouts/site-header';
import { getCurrentUser } from '@/app/_actions/auth';

type DataLayoutProps = {
  children: React.ReactNode
}

const DataLayout = async ({ children }: DataLayoutProps) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.isEmailVerified !== true) {
    redirect('/verify-email-required');
  }

  return (
      <div className="relative flex min-h-screen flex-col" >
        <SiteHeader user={user} />
        <main className="flex-1">{children}</main>
        {/* <SiteFooter /> */}
      </div>
  );
};

export default DataLayout;
