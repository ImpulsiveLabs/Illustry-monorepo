import React from 'react';
import { AppPage, PageSection } from '@/components/layouts/app-page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
  if (!currentDashboard) {
    notFound();
  }
  const visualizations = await browseVisualizations({ per_page: 100 });
  const visualizationRows = visualizations && Array.isArray(visualizations.visualizations)
    ? visualizations.visualizations
    : [];

  const visualizationsObject = visualizationRows.reduce((acc, { name, type }) => {
    acc[`${name}(${type})`] = `${name}(${type})`;
    return acc;
  }, {} as Record<string, string>);

  return (
    <AppPage>
      <PageSection className="p-4 md:p-6">
      
        <UpdateDashboardForm
          dashboard={currentDashboard}
          visualizations={visualizationsObject}
        />
      </PageSection>
    </AppPage>
  );
};

export default UpdateDashboardPage;
