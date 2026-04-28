import React from 'react';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/layouts/site-header';
import { getCurrentUser } from '@/app/_actions/auth';

type HubLayoutProps = {
  children: React.ReactNode;
}

const HubLayout = async ({ children }: HubLayoutProps) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.isEmailVerified !== true) {
    redirect('/verify-email-required');
  }

  return (
      <>
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader user={user} />
          <main className="flex-1">{children}</main>
          {/* <SiteFooter /> */}
        </div>
      </>
  );
};

export default HubLayout;
