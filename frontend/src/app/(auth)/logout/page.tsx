'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { logoutUser } from '@/lib/auth-client';

const LogoutPage = () => {
  const router = useRouter();
  const { t } = useLocale();

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
      <p className="text-sm text-muted-foreground">{t('auth.logout.pending')}</p>
    </main>
  );
};

export default LogoutPage;
