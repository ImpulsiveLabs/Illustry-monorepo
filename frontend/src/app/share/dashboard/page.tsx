import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/_actions/auth';
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

  return (
    <ShareFormClient
      resource="dashboard"
      name={name}
      currentUserEmail={currentUser.email}
    />
  );
};

export default ShareDashboardPage;
