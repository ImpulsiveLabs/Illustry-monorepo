import React from 'react';
import { Metadata } from 'next';
import { VisualizationTypes } from '@illustry/types';
import { browseVisualizations } from '@/app/_actions/visualization';
import VisualizationsTableShell from '@/components/shells/visualizations-table-shell';

const metadata: Metadata = {
  title: 'Visualizations',
  description: 'Manage your Visualizations'
};

type VisualizationsProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

const Visualizations = async ({ searchParams }: VisualizationsProps) => {
  const {
    page, text, per_page: perPage, sort
  } = searchParams;
  const visualizations = await browseVisualizations({
    page: page ? Number(page) : 1,
    text,
    per_page: perPage ? Number(perPage) : 10,
    sort: sort
      ? {
        sortOrder: (sort as string).split('.')[1] === 'asc' ? 1 : -1,
        element: (sort as string).split('.')[0]
      }
      : undefined
  } as VisualizationTypes.VisualizationFilter);
  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-gray-50 rounded-3xl dark:bg-gray-800">
      <div className="space-y-2.5">
        <VisualizationsTableShell
          data={visualizations ? visualizations.visualizations : []}
          pageCount={visualizations ? Math.ceil(visualizations.pagination?.pageCount as number) : 1}
        ></VisualizationsTableShell>
      </div>
    </div>
  );
};

export default Visualizations;
export { metadata };
