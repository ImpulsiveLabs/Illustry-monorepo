'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { registerUser } from '@/lib/auth-client';

const RegisterPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRules = [
    { id: 'min-length', label: 'At least 12 characters', valid: password.length >= 12 },
    { id: 'uppercase', label: 'At least one uppercase letter', valid: /[A-Z]/.test(password) },
    { id: 'lowercase', label: 'At least one lowercase letter', valid: /[a-z]/.test(password) },
    { id: 'digit', label: 'At least one number', valid: /\d/.test(password) },
    { id: 'special', label: 'At least one special character', valid: /[^A-Za-z0-9]/.test(password) }
  ];
  const isPasswordStrong = passwordRules.every((rule) => rule.valid);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await registerUser(email, password);
      const encodedEmail = encodeURIComponent(response.user.email);
      router.push(`/verify-email-required?email=${encodedEmail}`);
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/70 dark:bg-slate-950">
      <div className="container mx-auto flex min-h-screen items-center justify-center py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border bg-background shadow-sm md:grid-cols-[1.1fr_1fr]">
          <section className="hidden border-r bg-slate-100/70 p-8 dark:bg-slate-900/60 md:block">
            <div className="space-y-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-semibold leading-tight">Create your Illustry account</h1>
              <p className="text-sm text-muted-foreground">
                Register once, verify your email, and keep your data visualizations private by default.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="list-disc ml-5">Single account access with secure cookie-based sessions.</li>
                <li className="list-disc ml-5">Email verification required before data routes are unlocked.</li>
                <li className="list-disc ml-5">Password checklist is enforced before creating the account.</li>
              </ul>
            </div>
          </section>

          <Card as="section" className="rounded-none border-0 shadow-none">
            <CardHeader className="space-y-2">
              <CardTitle as="h2" className="text-2xl">Create account</CardTitle>
              <CardDescription>Set a strong password to protect your workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                <div className="rounded-md border bg-slate-50/80 p-3 text-sm dark:bg-slate-900/60">
                  <p className="mb-2 font-medium">Password checklist</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {passwordRules.map((rule) => (
                      <li key={rule.id} className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            rule.valid ? 'bg-emerald-600' : 'bg-slate-400 dark:bg-slate-500'
                          }`}
                        />
                        <span>{rule.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {error ? <p className="text-sm text-red-500">{error}</p> : null}
                <Button className="w-full" disabled={pending || !isPasswordStrong} type="submit">
                  {pending ? 'Creating account...' : 'Create account'}
                </Button>
                <p className="text-sm">
                  Already have an account? <Link className="underline" href="/login">Sign in</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
