import React from 'react';
import type { Metadata } from 'next';
import { findOneDashboard } from '@/app/_actions/dashboard';
import UpdateDashboardForm from '@/components/form/update-dashboard-form';
import { browseVisualizations } from '@/app/_actions/visualization';

const metadata: Metadata = {
  title: 'Update Dashboard',
  description: 'Update a product'
};

type UpdateDashboardPageProps = {
  params: {
    dashboardName: string;
  };
}

const UpdateDashboardPage = async ({
  params
}: UpdateDashboardPageProps) => {
  const { dashboardName } = params;
  const currentDashboard = await findOneDashboard(dashboardName, false);
  const visualizations = await browseVisualizations({ per_page: 100 });
  const visualizationsObject = visualizations ? visualizations.visualizations?.reduce((acc, { name, type }) => {
    acc[`${name}(${type})`] = `${name}(${type})`;
    return acc;
  }, {} as Record<string, string>) : {};
  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-gray-50 rounded-3xl dark:bg-gray-800">
      <div className="space-y-2.5">
        <UpdateDashboardForm dashboard={currentDashboard} visualizations={visualizationsObject as Record<string, string>} />
      </div>
    </div>
  );
};

export default UpdateDashboardPage;
export { metadata };
export type { UpdateDashboardPageProps };
