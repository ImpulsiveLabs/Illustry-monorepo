import type { Metadata } from 'next';
import React from 'react';
import { browseVisualizations } from '@/app/_actions/visualization';
import AddDashboardForm from '@/components/form/add-dashboard-form';

export const metadata: Metadata = {
  title: 'New Dashboard',
  description: 'Add a new Dashboard'
};

const NewDashboardPage = async () => {
  const visualizations = await browseVisualizations({ per_page: 100 });

  const visualizationsObject = visualizations
    ? visualizations.visualizations?.reduce((acc, { name, type }) => {
      acc[`${name}(${type})`] = `${name}(${type})`;
      return acc;
    }, {} as Record<string, string>)
    : {};

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-gray-50 rounded-3xl dark:bg-gray-800">
      <div className="space-y-2.5">
        <AddDashboardForm visualizations={visualizationsObject as Record<string, string> } />
      </div>
    </div>
  );
};

export default NewDashboardPage;
