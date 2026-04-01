'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import {
  resendVerification,
  verifyEmailCode
} from '@/lib/auth-client';

const VerifyEmailRequiredPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verifyPending, setVerifyPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailFromQuery = params.get('email');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, []);

  const onVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setVerifyPending(true);
    setError(null);
    setMessage(null);

    try {
      await verifyEmailCode(email, code);
      setMessage('Email verified successfully. Redirecting...');
      router.push('/projects');
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setVerifyPending(false);
    }
  };

  const onResendVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendPending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await resendVerification(email || undefined);
      setMessage(response.message);
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setResendPending(false);
    }
  };

  return (
    <main className="container flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Email verification required</h1>
          <p className="text-sm text-muted-foreground">
            Paste the 6-digit code from your inbox to unlock your account.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onVerifyCode}>
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="Email used for registration"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            required
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="6-digit verification code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <Button className="w-full" disabled={verifyPending || code.length !== 6} type="submit">
            {verifyPending ? 'Verifying...' : 'Verify code'}
          </Button>
        </form>

        <form className="space-y-2" onSubmit={onResendVerification}>
          <Button className="w-full" disabled={resendPending || email.length === 0} type="submit" variant="outline">
            {resendPending ? 'Sending...' : 'Resend verification code'}
          </Button>
        </form>

        {message ? <p className="text-sm text-green-600">{message}</p> : null}
        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <p className="text-sm">
          <Link className="underline" href="/login">Back to sign in</Link>
        </p>
      </div>
    </main>
  );
};

export default VerifyEmailRequiredPage;
