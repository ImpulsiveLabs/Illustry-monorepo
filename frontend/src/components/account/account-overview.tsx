'use client';

import Link from 'next/link';
import { PencilLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Separator from '@/components/ui/separator';
import { useLocale } from '@/components/providers/locale-provider';
import type { CurrentUser } from '@/lib/auth-user';

type AccountOverviewProps = {
  user: CurrentUser;
};

const getInitials = (name: string, email: string) => {
  const source = name.trim() || email;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const AccountOverview = ({ user }: AccountOverviewProps) => {
  const { t } = useLocale();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{t('auth.account.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.account.subtitle')}</p>
        </div>
        <Button asChild>
          <Link href="/account/edit">
            <PencilLine className="mr-2 h-4 w-4" />
            {t('auth.account.edit')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('auth.account.profileCard')}</CardTitle>
          <CardDescription>{t('auth.account.editSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.name} avatar`}
                className="h-24 w-24 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 text-xl font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                {getInitials(user.name, user.email)}
              </div>
            )}
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant={user.isEmailVerified ? 'default' : 'secondary'}>
                {user.isEmailVerified ? t('auth.account.verified') : t('auth.account.unverified')}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm font-medium">{t('auth.account.emailLabel')}</div>
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm font-medium">{t('auth.account.statusLabel')}</div>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.isEmailVerified ? t('auth.account.verified') : t('auth.account.unverified')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountOverview;
