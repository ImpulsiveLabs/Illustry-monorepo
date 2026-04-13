'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/providers/locale-provider';
import { verifyEmailToken } from '@/lib/auth-client';

export const dynamic = 'force-dynamic';

const VerifyEmailPage = () => {
  const router = useRouter();
  const { t } = useLocale();
  const [token, setToken] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, []);

  const verify = async () => {
    setPending(true);
    setError(null);

    try {
      await verifyEmailToken(token);
      router.push('/projects');
    } catch (verificationError) {
      setError((verificationError as Error).message);
    } finally {
      setPending(false);
    }
  };

  if (!token) {
    return (
      <main className="container flex min-h-[80vh] items-center justify-center py-10">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-semibold">{t('auth.verify.title')}</h1>
          <p className="text-sm text-red-500">{t('auth.verify.missingToken')}</p>
          <Link className="text-sm underline" href="/verify-email-required">{t('auth.verify.resendLink')}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">{t('auth.verify.formTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.verify.description')}</p>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button className="w-full" disabled={pending} onClick={verify}>
          {pending ? t('auth.verify.pending') : t('auth.verify.action')}
        </Button>
      </div>
    </main>
  );
};

export default VerifyEmailPage;
