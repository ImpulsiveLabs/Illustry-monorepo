'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import {
  getGoogleAuthStartUrl,
  isGoogleAuthEnabled,
  loginUser
} from '@/lib/auth-client';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [next, setNext] = useState('/projects');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('next');
    const oauthError = params.get('error');
    if (fromQuery) {
      setNext(fromQuery);
    }
    if (oauthError === 'google_auth_failed' || oauthError === 'google_state_mismatch') {
      setError('Google sign-in failed. Please try again.');
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await loginUser(email, password);
      if (response.user?.isEmailVerified) {
        router.push(next);
      } else {
        router.push(`/verify-email-required?email=${encodeURIComponent(response.user.email)}`);
      }
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setPending(false);
    }
  };

  const onGoogleLogin = () => {
    window.location.href = getGoogleAuthStartUrl(next);
  };

  return (
    <main className="min-h-screen bg-slate-50/70 dark:bg-slate-950">
      <div className="container mx-auto flex min-h-screen items-center justify-center py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border bg-background shadow-sm md:grid-cols-[1.1fr_1fr]">
          <section className="hidden border-r bg-slate-100/70 p-8 dark:bg-slate-900/60 md:block">
            <div className="space-y-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-semibold leading-tight">Welcome back to Illustry</h1>
              <p className="text-sm text-muted-foreground">
                Sign in to continue with your private projects, visualizations, and dashboards.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="list-disc ml-5">Your session is protected with secure HTTP-only cookies.</li>
                <li className="list-disc ml-5">Every visualization remains scoped to your account.</li>
                <li className="list-disc ml-5">Use the same email you registered with.</li>
              </ul>
            </div>
          </section>

          <Card as="section" className="rounded-none border-0 shadow-none">
            <CardHeader className="space-y-2">
              <CardTitle as="h2" className="text-2xl">Sign in</CardTitle>
              <CardDescription>Use your Illustry account to continue.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                {error ? <p className="text-sm text-red-500">{error}</p> : null}
                <Button className="w-full" disabled={pending} type="submit">
                  <LockKeyhole className="mr-2 h-4 w-4" />
                  {pending ? 'Signing in...' : 'Sign in'}
                </Button>
                {isGoogleAuthEnabled() ? (
                  <Button className="w-full" onClick={onGoogleLogin} type="button" variant="outline">
                    Continue with Google
                  </Button>
                ) : null}
                <div className="flex justify-between text-sm">
                  <Link className="underline" href="/register">Create account</Link>
                  <Link className="underline" href="/forgot-password">Forgot password</Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
