import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/_actions/auth';
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

  return (
    <ShareFormClient
      resource="visualization"
      name={name}
      type={type}
      currentUserEmail={currentUser.email}
    />
  );
};

export default ShareVisualizationPage;
