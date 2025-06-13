import React from 'react';
import { Metadata } from 'next';
import { VisualizationTypes } from '@illustry/types';
import { findOneVisualization } from '@/app/_actions/visualization';
import HubShell from '@/components/shells/hub-shell';

const metadata: Metadata = {
  title: 'Visualizations',
  description: 'Manage your Visualizations'
};

type VisualizationsProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

const Hub = async ({ searchParams }: VisualizationsProps) => {
  const { name, type } = searchParams;
  const visualization = await findOneVisualization({
    name,
    type
  } as VisualizationTypes.VisualizationFilter);
  return (
    <>
      <HubShell data={visualization} fullScreen={true} filter={true} legend={true}></HubShell>
    </>
  );
};

export default Hub;
export { metadata };
