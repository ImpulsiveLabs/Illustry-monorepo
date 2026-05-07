'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { respondToDashboardShareInvite } from '@/app/_actions/dashboard';
import { respondToVisualizationShareInvite } from '@/app/_actions/visualization';
import { Button } from '@/components/ui/button';

const ShareInviteClient = ({ token }: { token: string }) => {
  const router = useRouter();

  const respond = async (decision: 'accept' | 'reject') => {
    const dashboardResult = await respondToDashboardShareInvite({ token, decision });
    const visualizationResult = dashboardResult ? null : await respondToVisualizationShareInvite({ token, decision });

    if (!dashboardResult && !visualizationResult) {
      toast.error('Invitation is invalid or expired');
      return;
    }

    toast.success(decision === 'accept' ? 'Invitation accepted' : 'Invitation rejected');
    router.push(dashboardResult ? '/dashboards' : '/visualizations');
  };

  return (
    <main className="mx-auto mt-28 flex max-w-xl flex-col gap-4 px-6">
      <h1 className="text-2xl font-semibold">Share invitation</h1>
      <p className="text-sm text-muted-foreground">Choose whether you want to participate in this shared Illustry item.</p>
      <div className="flex gap-2">
        <Button type="button" onClick={() => void respond('accept')} disabled={!token}>Accept</Button>
        <Button type="button" variant="outline" onClick={() => void respond('reject')} disabled={!token}>Reject</Button>
      </div>
    </main>
  );
};

export default ShareInviteClient;
