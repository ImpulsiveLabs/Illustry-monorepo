import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findOneDashboard, findSharedDashboard } from '@/app/_actions/dashboard';
import ResizableDashboard from '@/components/shells/dashboard-shell';

export const metadata: Metadata = {
  title: 'Dashboards',
  description: 'Manage your Dashboards',
};

type DashboardProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
	    name?: string;
	    share?: string;
	  }>;
};

const DashboardHub = async ({ searchParams }: DashboardProps) => {
  const sp = await searchParams;
  const name = typeof sp.name === 'string' ? sp.name : undefined;
  const share = typeof sp.share === 'string' ? sp.share : undefined;

  const dashboard = share
    ? await findSharedDashboard(share, true)
    : await findOneDashboard(name ?? '', true);
  if ((name || share) && !dashboard) {
    notFound();
  }

  return <ResizableDashboard dashboard={dashboard} />;
};

export default DashboardHub;
