import type { Metadata } from 'next';
import type { DashboardTypes } from '@illustry/types';
import React from 'react';
import { browseDashboards, findOneDashboard } from '@/app/_actions/dashboard';
import { browseVisualizations } from '@/app/_actions/visualization';
import DashboardsTableShell from '@/components/shells/dashboards-table-shell';
import { AppPage, PageSection } from '@/components/layouts/app-page';
import AddDashboardForm from '@/components/form/add-dashboard-form';
import UpdateDashboardForm from '@/components/form/update-dashboard-form';

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
    modal?: string;
    edit?: string;
  }>;
};

const Dashboards = async ({ searchParams }: DashboardsProps) => {
  const sp = await searchParams;

  const page = typeof sp.page === 'string' ? sp.page : undefined;
  const text = typeof sp.text === 'string' ? sp.text : undefined;
  const perPage = typeof sp.per_page === 'string' ? sp.per_page : undefined;
  const sort = typeof sp.sort === 'string' ? sp.sort : undefined;
  const scope = sp.scope === 'external' ? 'external' : 'owned';
  const showCreateModal = scope !== 'external' && sp.modal === 'new';
  const editDashboardName = scope !== 'external' && typeof sp.edit === 'string' ? sp.edit : undefined;

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
  const needsDashboardModalData = showCreateModal || Boolean(editDashboardName);
  const modalVisualizations = needsDashboardModalData
    ? await browseVisualizations({ per_page: 100 })
    : null;
  const visualizationRows = modalVisualizations && Array.isArray(modalVisualizations.visualizations)
    ? modalVisualizations.visualizations
    : [];
  const visualizationsObject = visualizationRows.reduce((acc, { name, type }) => {
    acc[`${name}(${type})`] = `${name}(${type})`;
    return acc;
  }, {} as Record<string, string>);
  const dashboardToEdit = editDashboardName ? await findOneDashboard(editDashboardName, false) : null;

  return (
    <AppPage>
      <PageSection className="p-4 md:p-6">
        <DashboardsTableShell
          data={dashboardRows}
          pageCount={dashboardsPageCount}
          external={scope === 'external'}
        />
        {showCreateModal ? <AddDashboardForm visualizations={visualizationsObject} /> : null}
        {dashboardToEdit ? (
          <UpdateDashboardForm
            dashboard={dashboardToEdit}
            visualizations={visualizationsObject}
          />
        ) : null}
      </PageSection>
    </AppPage>
  );
};

export default Dashboards;
