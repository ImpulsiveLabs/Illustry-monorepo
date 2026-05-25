'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import { useLocale } from '@/components/providers/locale-provider';
import { resetPassword } from '@/lib/auth-client';

export const dynamic = 'force-dynamic';

const ResetPasswordPage = () => {
  const router = useRouter();
  const { t } = useLocale();
  const [token, setToken] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const passwordRules = [
    { id: 'min-length', label: t('auth.register.passwordRule.minLength'), valid: password.length >= 12 },
    { id: 'uppercase', label: t('auth.register.passwordRule.uppercase'), valid: /[A-Z]/.test(password) },
    { id: 'lowercase', label: t('auth.register.passwordRule.lowercase'), valid: /[a-z]/.test(password) },
    { id: 'digit', label: t('auth.register.passwordRule.digit'), valid: /\d/.test(password) },
    { id: 'special', label: t('auth.register.passwordRule.special'), valid: /[^A-Za-z0-9]/.test(password) }
  ];
  const isPasswordStrong = passwordRules.every((rule) => rule.valid);
  const doPasswordsMatch = confirmPassword.length > 0 && password === confirmPassword;

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

    try {
      await resetPassword(token, password);
      toast.success(t('auth.toast.passwordUpdated'));
      router.push('/login');
    } catch (submissionError) {
      toast.error((submissionError as Error).message);
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
    <main className="min-h-screen bg-[hsl(var(--illustry-page-background))]">
      <div className="container mx-auto flex min-h-screen items-center justify-center py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border bg-background shadow-sm md:grid-cols-[1.1fr_1fr]">
          <section className="hidden border-r bg-[hsl(var(--illustry-section-background))] p-8 md:block">
            <div className="space-y-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <KeyRound className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-semibold leading-tight">{t('auth.resetPassword.formTitle')}</h1>
              <p className="text-sm text-muted-foreground">{t('auth.resetPassword.subtitle')}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="list-disc ml-5">{t('auth.register.passwordRule.minLength')}</li>
                <li className="list-disc ml-5">{t('auth.register.passwordRule.uppercase')}</li>
                <li className="list-disc ml-5">{t('auth.register.passwordRule.special')}</li>
              </ul>
            </div>
          </section>

          <Card as="section" className="rounded-none border-0 shadow-none">
            <CardHeader className="space-y-2">
              <CardTitle as="h2" className="text-2xl">{t('auth.resetPassword.formTitle')}</CardTitle>
              <CardDescription>{t('auth.resetPassword.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="reset-password">{t('auth.common.newPassword')}</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder={t('auth.resetPassword.passwordPlaceholder')}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-password">{t('auth.common.confirmPassword')}</Label>
                  <Input
                    id="reset-confirm-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder={t('auth.common.confirmPassword')}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>

                <div className="rounded-md border bg-[hsl(var(--illustry-section-background))] p-3 text-sm">
                  <p className="mb-2 font-medium">{t('auth.register.passwordChecklist')}</p>
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
                    <li className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          doPasswordsMatch ? 'bg-emerald-600' : 'bg-slate-400 dark:bg-slate-500'
                        }`}
                      />
                      <span>{doPasswordsMatch ? t('auth.account.passwordsMatch') : t('auth.account.passwordsUnmatch')}</span>
                    </li>
                  </ul>
                </div>

                <Button className="w-full" disabled={pending || !isPasswordStrong || !doPasswordsMatch} type="submit">
                  {pending ? t('auth.resetPassword.pending') : t('auth.resetPassword.action')}
                </Button>
                <p className="text-sm">
                  <Link className="underline" href="/login">{t('auth.common.backToSignIn')}</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default ResetPasswordPage;
