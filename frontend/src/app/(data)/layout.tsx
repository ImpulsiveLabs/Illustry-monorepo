import React from 'react';
import { redirect } from 'next/navigation';
import SiteHeader from '@/components/layouts/site-header';
import { getCurrentUser } from '@/app/_actions/auth';
import ErrorCard from '@/components/ui/error-card';
import type { CurrentUser } from '@/lib/auth-user';

type DataLayoutProps = {
  children: React.ReactNode
}

const DataLayout = async ({ children }: DataLayoutProps) => {
  let user: CurrentUser | null;
  try {
    user = await getCurrentUser();
  } catch {
    return (
      <div className="relative flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center p-6">
          <ErrorCard
            title="Backend unavailable"
            description="Your session was not cleared. The backend or database is not responding right now, so wait for it to recover and refresh this page."
            retryLink="/projects"
            retryLinkText="Retry"
            className="w-full max-w-xl"
          />
        </main>
      </div>
    );
  }

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
