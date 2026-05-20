import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/_actions/auth';
import { findOneDashboard } from '@/app/_actions/dashboard';
import { ShareFormClient } from '../share-form-client';

type ShareDashboardPageProps = {
  searchParams: Promise<{
    name?: string;
  }>;
}

const ShareDashboardPage = async ({ searchParams }: ShareDashboardPageProps) => {
  const [{ name }, currentUser] = await Promise.all([searchParams, getCurrentUser()]);

  if (!name || !currentUser) {
    redirect('/dashboards');
  }

  const dashboard = await findOneDashboard(name);
  const includedVisualizationCount = dashboard?.visualizations && !Array.isArray(dashboard.visualizations)
    ? Object.keys(dashboard.visualizations).length
    : 0;

  return (
    <ShareFormClient
      resource="dashboard"
      name={name}
      currentUserEmail={currentUser.email}
      existingShares={dashboard?.sharedWith || []}
      includedVisualizationCount={includedVisualizationCount}
    />
  );
};

export default ShareDashboardPage;
