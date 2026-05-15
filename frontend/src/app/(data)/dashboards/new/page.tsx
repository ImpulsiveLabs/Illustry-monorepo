import type { Metadata } from 'next';
import React from 'react';
import { AppPage, PageSection } from '@/components/layouts/app-page';
import { browseVisualizations } from '@/app/_actions/visualization';
import AddDashboardForm from '@/components/form/add-dashboard-form';

export const metadata: Metadata = {
  title: 'New Dashboard',
  description: 'Add a new Dashboard'
};
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NewDashboardPage = async () => {
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
      
        <AddDashboardForm visualizations={visualizationsObject} />
      </PageSection>
    </AppPage>
  );
};

export default NewDashboardPage;
