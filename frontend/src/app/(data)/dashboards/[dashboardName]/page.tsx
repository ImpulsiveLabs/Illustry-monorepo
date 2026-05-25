import { redirect } from 'next/navigation';

export type UpdateDashboardPageProps = {
  params: Promise<{
    dashboardName: string;
  }>;
};

const UpdateDashboardPage = async ({ params }: UpdateDashboardPageProps) => {
  const { dashboardName } = await params;
  redirect(`/dashboards?edit=${encodeURIComponent(dashboardName)}`);
};

export default UpdateDashboardPage;
