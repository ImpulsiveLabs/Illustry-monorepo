import React from 'react';
import { Metadata } from 'next';
import { findOneDashboard } from '@/app/_actions/dashboard';
import ResizableDashboard from '@/components/shells/dashboard-shell';

const metadata: Metadata = {
  title: 'Dashboards',
  description: 'Manage your Dashboards'
};

type DashboardProps = {
  searchParams: {
    [key: string]: string;
  };
}

const DashboardHub = async ({ searchParams }: DashboardProps) => {
  const { name } = searchParams;
  const dashboard = (await findOneDashboard((name as string), true));
  return (
    <>
      <ResizableDashboard
        dashboard={dashboard}
      />
    </>
  );
};

export default DashboardHub;
export { metadata };
