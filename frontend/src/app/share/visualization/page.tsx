import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/_actions/auth';
import { findOneVisualization } from '@/app/_actions/visualization';
import { ShareFormClient } from '../share-form-client';

type ShareVisualizationPageProps = {
  searchParams: Promise<{
    name?: string;
    type?: string;
  }>;
}

const ShareVisualizationPage = async ({ searchParams }: ShareVisualizationPageProps) => {
  const [{ name, type }, currentUser] = await Promise.all([searchParams, getCurrentUser()]);

  if (!name || !type || !currentUser) {
    redirect('/visualizations');
  }

  const visualization = await findOneVisualization({ name, type });

  return (
    <ShareFormClient
      resource="visualization"
      name={name}
      type={type}
      currentUserEmail={currentUser.email}
      existingShares={visualization?.sharedWith || []}
    />
  );
};

export default ShareVisualizationPage;
