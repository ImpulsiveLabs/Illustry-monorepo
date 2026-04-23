'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/components/providers/locale-provider';
import { verifyEmailToken } from '@/lib/auth-client';

export const dynamic = 'force-dynamic';

const VerifyEmailPage = () => {
  const router = useRouter();
  const { t } = useLocale();
  const [token, setToken] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const verify = async () => {
      setPending(true);

      try {
        await verifyEmailToken(token);
        toast.success(t('auth.toast.emailVerified'));
        if (active) {
          router.replace('/projects');
        }
      } catch (verificationError) {
        toast.error((verificationError as Error).message);
      } finally {
        if (active) {
          setPending(false);
        }
      }
    };

    void verify();

    return () => {
      active = false;
    };
  }, [router, t, token]);

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
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <CardTitle>{t('auth.verify.formTitle')}</CardTitle>
          <CardDescription>{t('auth.verify.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {pending ? t('auth.verify.pending') : t('auth.verify.action')}
          </p>
          {!pending ? (
            <Link className="mt-4 inline-block text-sm underline" href="/verify-email-required">
              {t('auth.verify.resendLink')}
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
};

export default VerifyEmailPage;
