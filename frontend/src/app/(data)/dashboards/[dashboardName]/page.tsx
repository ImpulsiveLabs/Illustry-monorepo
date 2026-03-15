import React from 'react';
import type { Metadata } from 'next';
import { findOneDashboard } from '@/app/_actions/dashboard';
import UpdateDashboardForm from '@/components/form/update-dashboard-form';
import { browseVisualizations } from '@/app/_actions/visualization';

export const metadata: Metadata = {
  title: 'Update Dashboard',
  description: 'Update a product',
};

export type UpdateDashboardPageProps = {
  params: Promise<{
    dashboardName: string;
  }>;
};

const UpdateDashboardPage = async ({ params }: UpdateDashboardPageProps) => {
  const { dashboardName } = await params;

  const currentDashboard = await findOneDashboard(dashboardName, false);
  const visualizations = await browseVisualizations({ per_page: 100 });
  const visualizationRows = visualizations && Array.isArray(visualizations.visualizations)
    ? visualizations.visualizations
    : [];

  const visualizationsObject = visualizationRows.reduce((acc, { name, type }) => {
    acc[`${name}(${type})`] = `${name}(${type})`;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-gray-50 rounded-3xl dark:bg-gray-800">
      <div className="space-y-2.5">
        <UpdateDashboardForm
          dashboard={currentDashboard}
          visualizations={visualizationsObject}
        />
      </div>
    </div>
  );
};

export default UpdateDashboardPage;
