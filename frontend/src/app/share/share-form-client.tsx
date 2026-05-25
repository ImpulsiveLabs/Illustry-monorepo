'use client';

import { DashboardTypes, VisualizationTypes } from '@illustry/types';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { revokeDashboardShare, shareDashboard } from '@/app/_actions/dashboard';
import { revokeVisualizationShare, shareVisualization } from '@/app/_actions/visualization';
import { useThemeColors } from '@/components/providers/theme-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { catchError } from '@/lib/utils';

type ShareRole = 'viewer';

type ShareRow = {
  id: string;
  email: string;
  permission: ShareRole;
}

type ExistingShare = {
  userId: string;
  email?: string;
  name?: string;
  permission: ShareRole | 'editor';
  status?: 'pending' | 'accepted' | 'rejected';
  accessType?: 'direct' | 'inherited';
  sourceType?: 'dashboard' | 'visualization';
  sourceDashboardId?: string;
  sharedViaResource?: 'dashboard' | 'visualization';
  sharedViaShareId?: string;
}

type ShareFormClientProps = {
  resource: 'dashboard' | 'visualization';
  name: string;
  type?: string;
  currentUserEmail: string;
  existingShares?: ExistingShare[];
  includedVisualizationCount?: number;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const createRow = (): ShareRow => ({
  id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  email: '',
  permission: 'viewer'
});

const ShareFormClient = ({
  resource,
  name,
  type,
  currentUserEmail,
  existingShares = [],
  includedVisualizationCount = 0
}: ShareFormClientProps) => {
  const router = useRouter();
  const { t } = useLocale();
  const activeTheme = useThemeColors();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<ShareRow[]>([createRow()]);
  const currentUserEmailNormalized = normalizeEmail(currentUserEmail);
  const activeExistingShares = useMemo(
    () => {
      const sharesByUser = new Map<string, ExistingShare>();
      existingShares
        .filter((share) => share.status !== 'rejected')
        .forEach((share) => {
          const existing = sharesByUser.get(share.userId);
          const isDirect = share.accessType !== 'inherited' && share.sharedViaResource !== 'dashboard';
          const existingIsInherited = existing?.accessType === 'inherited' || existing?.sharedViaResource === 'dashboard';
          if (!existing || (isDirect && existingIsInherited)) {
            sharesByUser.set(share.userId, share);
          }
        });
      return Array.from(sharesByUser.values());
    },
    [existingShares]
  );
  const existingShareEmails = useMemo(() => new Set(
    activeExistingShares
      .map((share) => (share.email ? normalizeEmail(share.email) : ''))
      .filter(Boolean)
  ), [activeExistingShares]);

  const validations = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const normalized = normalizeEmail(row.email);
      if (normalized) {
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }
    });

    return rows.map((row) => {
      const normalized = normalizeEmail(row.email);
      const isEmpty = normalized.length === 0;
      const invalid = !isEmpty && !emailPattern.test(normalized);
      const self = normalized.length > 0 && normalized === currentUserEmailNormalized;
      const duplicate = normalized.length > 0 && (counts.get(normalized) || 0) > 1;
      const alreadyShared = normalized.length > 0 && existingShareEmails.has(normalized);
      return {
        normalized,
        valid: !isEmpty && !invalid && !self && !duplicate && !alreadyShared,
        message: isEmpty
          ? ''
          : invalid
            ? t('share.validation.invalidEmail')
            : self
              ? t('share.validation.self')
                : duplicate
                  ? t('share.validation.duplicate')
                : alreadyShared
                  ? t('share.validation.alreadyShared')
                  : t('share.validation.valid')
      };
    });
  }, [currentUserEmailNormalized, existingShareEmails, rows, t]);

  const validCollaborators = rows
    .map((row, index) => ({ row, validation: validations[index] }))
    .filter((entry): entry is { row: ShareRow; validation: NonNullable<typeof entry.validation> } => (
      entry.validation?.valid === true
    ))
    .map(({ validation }) => ({
      email: validation.normalized,
      permission: 'viewer' as const
    }));

  const canSubmit = validCollaborators.length > 0
    && rows.every((row, index) => row.email.trim().length === 0 || validations[index]?.valid === true);

  const updateRow = (id: string, patch: Partial<ShareRow>) => {
    setRows((currentRows) => currentRows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id: string) => {
    setRows((currentRows) => (currentRows.length === 1 ? currentRows : currentRows.filter((row) => row.id !== id)));
  };

  const revokeShare = (share: ExistingShare) => {
    if (resource === 'visualization' && (share.accessType === 'inherited' || share.sharedViaResource === 'dashboard')) {
      toast.error(t('share.toast.revokeInheritedFromDashboard'));
      return;
    }

    const label = share.email || share.name || t('share.thisUser');
    if (!window.confirm(t('share.confirmRevoke').replace('{user}', label))) {
      return;
    }

    startTransition(() => {
      toast.promise((async () => {
        const result = resource === 'dashboard'
          ? await revokeDashboardShare({
            name,
            userId: share.userId
          })
          : await revokeVisualizationShare({
            name,
            type,
            userId: share.userId
          });

        if (!result) {
          throw new Error(t('share.toast.unableToRevoke'));
        }

        router.refresh();
        return result;
      })(), {
        loading: t('share.toast.revoking'),
        success: t('share.toast.revoked'),
        error: (err: unknown) => catchError(err)
      });
    });
  };

  const submit = () => {
    if (!canSubmit) {
      return;
    }

    startTransition(() => {
      toast.promise((async () => {
        const result = resource === 'dashboard'
          ? await shareDashboard({
            name,
            collaborators: validCollaborators as DashboardTypes.DashboardShareRequest['collaborators']
          })
          : await shareVisualization({
            name,
            type,
            theme: activeTheme as unknown as Record<string, unknown>,
            collaborators: validCollaborators as VisualizationTypes.VisualizationShareRequest['collaborators']
          });

        if (!result) {
          throw new Error(t('share.toast.unableToSend'));
        }

        setRows([createRow()]);
        router.refresh();
        return result;
      })(), {
        loading: t('share.toast.sending'),
        success: t('share.toast.sent'),
        error: (err: unknown) => catchError(err)
      });
    });
  };

  return (
    <div className="mx-auto mt-16 max-w-4xl space-y-5 rounded-lg bg-background p-6 shadow-sm ring-1 ring-border">
      <div>
        <h1 className="text-2xl font-semibold">
          {resource === 'dashboard' ? t('share.titleDashboard') : t('share.titleVisualization')}
        </h1>
        <p className="text-sm text-muted-foreground">{name}</p>
        {resource === 'dashboard' && (
          <p className="mt-2 rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            {t('share.dashboardIncludesVisualizations')
              .replace('{count}', String(includedVisualizationCount))
              .replace('{plural}', includedVisualizationCount === 1 ? '' : 's')}
          </p>
        )}
      </div>
      <section className="rounded-md border bg-muted/20 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">{t('share.currentPermissions')}</h2>
            <p className="text-xs text-muted-foreground">{t('share.currentPermissionsDescription')}</p>
          </div>
        </div>
        {activeExistingShares.length > 0 ? (
          <div className="divide-y rounded-md border bg-background">
            {activeExistingShares.map((share) => {
              const inherited = share.accessType === 'inherited' || share.sharedViaResource === 'dashboard';
              return (
                <div key={share.userId} className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_110px_110px_110px_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{share.name || share.email || t('share.sharedUser')}</p>
                  {share.email && <p className="truncate text-xs text-muted-foreground">{share.email}</p>}
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-center text-xs font-medium capitalize text-secondary-foreground">
                  {t('share.role.viewer')}
                </span>
                <span className="rounded-full border px-2.5 py-1 text-center text-xs capitalize text-muted-foreground">
                  {inherited ? t('share.access.inherited') : t('share.access.direct')}
                </span>
                <span className="rounded-full border px-2.5 py-1 text-center text-xs capitalize text-muted-foreground">
                  {t(`share.status.${share.status || 'accepted'}`)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending || inherited}
                  onClick={() => revokeShare(share)}
                >
                  {t('share.revoke')}
                </Button>
              </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
            {t('share.noPermissions')}
          </p>
        )}
      </section>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="grid gap-2 md:grid-cols-[1fr_90px_40px]">
            <div>
              <Input
                aria-label={`${t('auth.common.email')} ${index + 1}`}
                type="email"
                placeholder={t('share.emailPlaceholder')}
                value={row.email}
                onChange={(event) => updateRow(row.id, { email: event.target.value })}
              />
              {validations[index]?.message && (
                <p
                  className={`mt-1 text-xs ${validations[index]?.valid ? 'text-green-600' : 'text-red-600'}`}
                >
                  {validations[index]?.message}
                </p>
              )}
            </div>
            <span className="flex h-10 items-center justify-center rounded-md border bg-muted/30 px-3 text-sm font-medium text-muted-foreground">
              {t('share.role.viewer')}
            </span>
            <Button
              aria-label={`${t('share.removeEmail')} ${index + 1}`}
              type="button"
              variant="ghost"
              size="icon"
              disabled={rows.length === 1}
              onClick={() => removeRow(row.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRows((currentRows) => [...currentRows, createRow()])}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('share.addUser')}
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>{t('common.cancel')}</Button>
          <Button type="button" disabled={!canSubmit || isPending} onClick={submit}>
            {t('share.action')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { ShareFormClient, normalizeEmail, emailPattern };
