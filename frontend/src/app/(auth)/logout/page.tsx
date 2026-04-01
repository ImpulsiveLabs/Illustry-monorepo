'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { logoutUser } from '@/lib/auth-client';

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        await logoutUser();
      } finally {
        router.replace('/login');
      }
    };

    run();
  }, [router]);

  return (
    <main className="container flex min-h-[80vh] items-center justify-center py-10">
      <p className="text-sm text-muted-foreground">Signing out...</p>
    </main>
  );
};

export default LogoutPage;
