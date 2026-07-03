import React from 'react';
import { AppPage, PageSection } from '@/components/layouts/app-page';
import { Metadata } from 'next';
import { VisualizationTypes } from '@illustry/types';
import { browseVisualizations } from '@/app/_actions/visualization';
import VisualizationsTableShell from '@/components/shells/visualizations-table-shell';
import AddVisualizationForm from '@/components/form/add-visualization-form';
import ErrorCard from '@/components/ui/error-card';

const metadata: Metadata = {
  title: 'Visualizations',
  description: 'Manage your Visualizations'
};

type VisualizationsProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
    page?: string;
    text?: string;
    per_page?: string;
    sort?: string;
    scope?: string;
    modal?: string;
  }>;
};

const VisualizationsPage = async ({ searchParams }: VisualizationsProps) => {
  const sp = await searchParams;

  const page = typeof sp.page === 'string' ? sp.page : undefined;
  const text = typeof sp.text === 'string' ? sp.text : undefined;
  const perPage = typeof sp.per_page === 'string' ? sp.per_page : undefined;
  const sort = typeof sp.sort === 'string' ? sp.sort : undefined;
  const scope = sp.scope === 'external' ? 'external' : 'owned';
  const showCreateModal = scope !== 'external' && sp.modal === 'new';

  const visualizations = await browseVisualizations({
    page: page ? Number(page) : 1,
    text,
    per_page: perPage ? Number(perPage) : 10,
    sharedScope: scope === 'external' ? 'external' : 'owned',
    sort: sort
      ? {
        sortOrder: sort.split('.')[1] === 'asc' ? 1 : -1,
        element: sort.split('.')[0],
      }
      : undefined,
  } as VisualizationTypes.VisualizationFilter);

  if (!visualizations) {
    return (
      <AppPage className="flex min-h-[60vh] items-center justify-center">
        <ErrorCard
          title="Backend unavailable"
          description="Visualizations could not be loaded because the backend or database is not responding right now. Your session was not cleared."
          retryLink="/visualizations"
          retryLinkText="Retry"
          className="w-full max-w-xl"
        />
      </AppPage>
    );
  }

  const visualizationRows = visualizations && Array.isArray(visualizations.visualizations)
    ? visualizations.visualizations
    : [];
  const visualizationsPageCount = visualizations
    && visualizations.pagination
    && typeof visualizations.pagination.pageCount === 'number'
    ? Math.ceil(visualizations.pagination.pageCount)
    : 1;

  return (
    <AppPage>
      <PageSection className="p-4 md:p-6">
      
        <VisualizationsTableShell
          data={visualizationRows}
          pageCount={visualizationsPageCount}
          external={scope === 'external'}
        ></VisualizationsTableShell>
        {showCreateModal ? <AddVisualizationForm /> : null}
      </PageSection>
    </AppPage>
  );
};

export default VisualizationsPage;
export { metadata };
