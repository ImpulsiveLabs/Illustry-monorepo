import React from 'react';
import { Metadata } from 'next';
import { VisualizationTypes } from '@illustry/types';
import { findOneVisualization } from '@/app/_actions/visualization';
import HubShell from '@/components/shells/hub-shell';

const metadata: Metadata = {
  title: 'Visualizations',
  description: 'Manage your Visualizations'
};

type HubProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
    name?: string;
    type?: string;
  }>;
};

const VisualizationHub = async ({ searchParams }: HubProps) => {
  const sp = await searchParams;

  const name = typeof sp.name === 'string' ? sp.name : undefined;
  const type = typeof sp.type === 'string' ? sp.type : undefined;

  const visualization = await findOneVisualization({
    name,
    type,
  } as VisualizationTypes.VisualizationFilter);

  return <HubShell data={visualization} fullScreen filter legend />;
};

export default VisualizationHub;
export { metadata };
