import React from 'react';
import type { Metadata } from 'next';
import { findOneDashboard } from '@/app/_actions/dashboard';
import ResizableDashboard from '@/components/shells/dashboard-shell';

export const metadata: Metadata = {
  title: 'Dashboards',
  description: 'Manage your Dashboards',
};

type DashboardProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
    name?: string;
  }>;
};

const DashboardHub = async ({ searchParams }: DashboardProps) => {
  const sp = await searchParams;
  const name = typeof sp.name === 'string' ? sp.name : undefined;

  const dashboard = await findOneDashboard(name ?? '', true);

  return <ResizableDashboard dashboard={dashboard} />;
};

export default DashboardHub;
