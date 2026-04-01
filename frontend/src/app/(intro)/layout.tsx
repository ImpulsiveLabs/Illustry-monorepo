import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/_actions/auth';
import SiteHeader from '@/components/layouts/site-header';

type IntroLayoutProps = {
  children: React.ReactNode
}

const IntroLayout = async ({ children }: IntroLayoutProps) => {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.isEmailVerified !== true) {
    redirect('/verify-email-required');
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {/* <SiteFooter /> */}
    </div>
  );
};

export default IntroLayout;
