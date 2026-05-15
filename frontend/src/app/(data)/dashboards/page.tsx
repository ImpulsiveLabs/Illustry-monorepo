import type { Metadata } from 'next';
import type { DashboardTypes } from '@illustry/types';
import React from 'react';
import { browseDashboards } from '@/app/_actions/dashboard';
import DashboardsTableShell from '@/components/shells/dashboards-table-shell';
import { AppPage, PageSection } from '@/components/layouts/app-page';

export const metadata: Metadata = {
  title: 'Dashboards',
  description: 'Manage your Dashboards',
};

export type DashboardsProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
    page?: string;
    text?: string;
    per_page?: string;
    sort?: string;
    scope?: string;
  }>;
};

const Dashboards = async ({ searchParams }: DashboardsProps) => {
  const sp = await searchParams;

  const page = typeof sp.page === 'string' ? sp.page : undefined;
  const text = typeof sp.text === 'string' ? sp.text : undefined;
  const perPage = typeof sp.per_page === 'string' ? sp.per_page : undefined;
  const sort = typeof sp.sort === 'string' ? sp.sort : undefined;
  const scope = sp.scope === 'external' ? 'external' : 'owned';

  const dashboards = await browseDashboards({
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
  } as DashboardTypes.DashboardFilter);

  const dashboardRows = dashboards && Array.isArray(dashboards.dashboards)
    ? dashboards.dashboards
    : [];
  const dashboardsPageCount = dashboards
    && dashboards.pagination
    && typeof dashboards.pagination.pageCount === 'number'
    ? Math.ceil(dashboards.pagination.pageCount)
    : 1;

  return (
    <AppPage>
      <PageSection className="p-4 md:p-6">
        <DashboardsTableShell
          data={dashboardRows}
          pageCount={dashboardsPageCount}
          external={scope === 'external'}
        />
      </PageSection>
    </AppPage>
  );
};

export default Dashboards;
