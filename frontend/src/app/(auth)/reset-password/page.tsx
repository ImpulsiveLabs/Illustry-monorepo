'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useLocale } from '@/components/providers/locale-provider';
import { resetPassword } from '@/lib/auth-client';

export const dynamic = 'force-dynamic';

const ResetPasswordPage = () => {
  const router = useRouter();
  const { t } = useLocale();
  const [token, setToken] = useState('');

  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await resetPassword(token, password);
      router.push('/login');
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setPending(false);
    }
  };

  if (!token) {
    return (
      <main className="container flex min-h-[80vh] items-center justify-center py-10">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-semibold">{t('auth.resetPassword.title')}</h1>
          <p className="text-sm text-red-500">{t('auth.resetPassword.missingToken')}</p>
          <Link className="text-sm underline" href="/forgot-password">{t('auth.resetPassword.requestAnother')}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container flex min-h-[80vh] items-center justify-center py-10">
      <form className="w-full max-w-md space-y-4" onSubmit={onSubmit}>
        <h1 className="text-2xl font-semibold">{t('auth.resetPassword.formTitle')}</h1>
        <Input
          type="password"
          required
          autoComplete="new-password"
          placeholder={t('auth.resetPassword.passwordPlaceholder')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? t('auth.resetPassword.pending') : t('auth.resetPassword.action')}
        </Button>
      </form>
    </main>
  );
};

export default ResetPasswordPage;
