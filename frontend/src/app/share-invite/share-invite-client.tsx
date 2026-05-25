'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { respondToDashboardShareInvite } from '@/app/_actions/dashboard';
import { respondToVisualizationShareInvite } from '@/app/_actions/visualization';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/providers/locale-provider';

const ShareInviteClient = ({ token }: { token: string }) => {
  const router = useRouter();
  const { t } = useLocale();

  const respond = async (decision: 'accept' | 'reject') => {
    const dashboardResult = await respondToDashboardShareInvite({ token, decision });
    const visualizationResult = dashboardResult ? null : await respondToVisualizationShareInvite({ token, decision });

    if (!dashboardResult && !visualizationResult) {
      toast.error(t('shareInvite.invalid'));
      return;
    }

    toast.success(decision === 'accept' ? t('shareInvite.accepted') : t('shareInvite.rejected'));
    router.push(dashboardResult ? '/dashboards' : '/visualizations');
  };

  return (
    <main className="mx-auto mt-28 flex max-w-xl flex-col gap-4 px-6">
      <h1 className="text-2xl font-semibold">{t('shareInvite.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('shareInvite.description')}</p>
      <div className="flex gap-2">
        <Button type="button" onClick={() => void respond('accept')} disabled={!token}>{t('shareInvite.accept')}</Button>
        <Button type="button" variant="outline" onClick={() => void respond('reject')} disabled={!token}>{t('shareInvite.reject')}</Button>
      </div>
    </main>
  );
};

export default ShareInviteClient;
