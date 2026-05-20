import React from 'react';
import { Metadata } from 'next';
import { VisualizationTypes } from '@illustry/types';
import {
  findDashboardSharedVisualization,
  findOneVisualization,
  findSharedVisualization
} from '@/app/_actions/visualization';
import VisualizationHubClient from './visualization-hub-client';

const metadata: Metadata = {
  title: 'Visualizations',
  description: 'Manage your Visualizations'
};

type HubProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
    name?: string;
    type?: string;
    share?: string;
    dashboardShare?: string;
  }>;
};

const VisualizationHub = async ({ searchParams }: HubProps) => {
  const sp = await searchParams;

  const name = typeof sp.name === 'string' ? sp.name : undefined;
  const type = typeof sp.type === 'string' ? sp.type : undefined;
  const share = typeof sp.share === 'string' ? sp.share : undefined;
  const dashboardShare = typeof sp.dashboardShare === 'string' ? sp.dashboardShare : undefined;

  const visualization = share
    ? await findSharedVisualization(share)
    : dashboardShare && name && type
      ? await findDashboardSharedVisualization(dashboardShare, { name, type })
    : await findOneVisualization({
      name,
      type,
    } as VisualizationTypes.VisualizationFilter);

  return <VisualizationHubClient visualization={visualization} />;
};

export default VisualizationHub;
export { metadata };
