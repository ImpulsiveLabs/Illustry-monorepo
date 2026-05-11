'use client';

import { DashboardTypes, VisualizationTypes } from '@illustry/types';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { shareDashboard } from '@/app/_actions/dashboard';
import { shareVisualization } from '@/app/_actions/visualization';
import { useThemeColors } from '@/components/providers/theme-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { catchError } from '@/lib/utils';

type ShareRole = 'viewer' | 'editor';

type ShareRow = {
  id: string;
  email: string;
  permission: ShareRole;
}

type ShareFormClientProps = {
  resource: 'dashboard' | 'visualization';
  name: string;
  type?: string;
  currentUserEmail: string;
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
  currentUserEmail
}: ShareFormClientProps) => {
  const router = useRouter();
  const { t } = useLocale();
  const activeTheme = useThemeColors();
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<ShareRow[]>([createRow()]);
  const currentUserEmailNormalized = normalizeEmail(currentUserEmail);

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
      return {
        normalized,
        valid: !isEmpty && !invalid && !self && !duplicate,
        message: isEmpty
          ? ''
          : invalid
            ? t('share.validation.invalidEmail')
            : self
              ? t('share.validation.self')
              : duplicate
                ? t('share.validation.duplicate')
                : t('share.validation.valid')
      };
    });
  }, [currentUserEmailNormalized, rows, t]);

  const validCollaborators = rows
    .map((row, index) => ({ row, validation: validations[index] }))
    .filter((entry): entry is { row: ShareRow; validation: NonNullable<typeof entry.validation> } => (
      entry.validation?.valid === true
    ))
    .map(({ row, validation }) => ({
      email: validation.normalized,
      permission: row.permission
    }));

  const canSubmit = validCollaborators.length > 0
    && rows.every((row, index) => row.email.trim().length === 0 || validations[index]?.valid === true);

  const updateRow = (id: string, patch: Partial<ShareRow>) => {
    setRows((currentRows) => currentRows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id: string) => {
    setRows((currentRows) => (currentRows.length === 1 ? currentRows : currentRows.filter((row) => row.id !== id)));
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

        router.push(resource === 'dashboard' ? '/dashboards' : '/visualizations');
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
    <div className="mx-auto mt-24 max-w-3xl space-y-4 rounded-lg bg-background p-6 shadow-sm ring-1 ring-border">
      <div>
        <h1 className="text-2xl font-semibold">
          {resource === 'dashboard' ? t('share.titleDashboard') : t('share.titleVisualization')}
        </h1>
        <p className="text-sm text-muted-foreground">{name}</p>
      </div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.id} className="grid gap-2 md:grid-cols-[1fr_150px_40px]">
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
            <Select
              value={row.permission}
              onValueChange={(permission) => updateRow(row.id, { permission: permission as ShareRole })}
            >
              <SelectTrigger aria-label={`${t('share.roleLabel')} ${index + 1}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">{t('share.role.viewer')}</SelectItem>
                <SelectItem value="editor">{t('share.role.editor')}</SelectItem>
              </SelectContent>
            </Select>
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
