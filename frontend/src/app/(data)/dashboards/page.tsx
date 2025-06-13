import { Metadata } from 'next';
import { DashboardTypes } from '@illustry/types';
import React from 'react';
import { browseDashboards } from '@/app/_actions/dashboard';
import DashboardsTableShell from '@/components/shells/dashboards-table-shell';

const metadata: Metadata = {
  title: 'Dashboards',
  description: 'Manage your Dashboards'
};

type DashboardsProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}
const Dashboards = async ({ searchParams }: DashboardsProps) => {
  const {
    page, text, per_page: perPage, sort
  } = searchParams;

  const dashboards = await browseDashboards({
    page: page ? Number(page) : 1,
    text,
    per_page: perPage ? Number(perPage) : 10,
    sort: sort
      ? {
        sortOrder: (sort as string).split('.')[1] === 'asc' ? 1 : -1,
        element: (sort as string).split('.')[0]
      }
      : undefined
  } as DashboardTypes.DashboardFilter);
  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-gray-50 rounded-3xl dark:bg-gray-800">
      <div className="space-y-2.5">
        <DashboardsTableShell
          data={dashboards ? dashboards.dashboards : []}
          pageCount={dashboards ? Math.ceil(dashboards.pagination?.pageCount as number) : 1}
        ></DashboardsTableShell>
      </div>
    </div>
  );
};

export default Dashboards;
export { metadata };
export type { DashboardsProps };
