'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useLocale } from '@/components/providers/locale-provider';
import { requestPasswordReset } from '@/lib/auth-client';

const ForgotPasswordPage = () => {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.message);
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="container flex min-h-[80vh] items-center justify-center py-10">
      <form className="w-full max-w-md space-y-4" onSubmit={onSubmit}>
        <h1 className="text-2xl font-semibold">{t('auth.forgotPassword.title')}</h1>
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder={t('auth.forgotPassword.emailPlaceholder')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {message ? <p className="text-sm text-green-600">{message}</p> : null}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? t('auth.forgotPassword.pending') : t('auth.forgotPassword.action')}
        </Button>
        <p className="text-sm">
          <Link className="underline" href="/login">{t('auth.common.backToSignIn')}</Link>
        </p>
      </form>
    </main>
  );
};

export default ForgotPasswordPage;
