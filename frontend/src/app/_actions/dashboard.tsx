/* eslint-disable no-console */

'use server';

import 'dotenv/config';
import { DashboardTypes } from '@illustry/types';
import makeRequest from '@/lib/request';
import getBackendUrl from '@/lib/backend-url';
import { buildBackendHeaders } from '@/lib/auth-request';


const browseDashboards = async (filter?: DashboardTypes.DashboardFilter) => {
  const BACKEND = getBackendUrl() as string;

  let newFilter: DashboardTypes.DashboardFilter = {};

  if (filter) {
    newFilter = filter;
  }
  const request = new Request(`${BACKEND as string}/api/dashboards`, {
    method: 'POST',
    headers: await buildBackendHeaders({ asJson: true }),
    body: JSON.stringify(newFilter)
  });
  try {
    return await makeRequest<DashboardTypes.ExtendedDashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const deleteDashboard = async (dashboardName: string) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(`${BACKEND as string}/api/dashboard`, {
    method: 'DELETE',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify({
      name: dashboardName
    })
  });
  try {
    return await makeRequest<boolean>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const updateDashboard = async (dashboard: DashboardTypes.DashboardUpdate) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(`${BACKEND as string}/api/dashboard`, {
    method: 'PUT',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(dashboard)
  });
  try {
    return await makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const createDashboard = async (dashboard: DashboardTypes.DashboardCreate) => {
  const BACKEND = getBackendUrl() as string;

  const newDashboard = {
    projectName: dashboard.projectName,
    visualizations: dashboard.visualizations,
    description: dashboard.description,
    name: dashboard.name
  };
  const request = new Request(`${BACKEND as string}/api/dashboard`, {
    method: 'POST',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(newDashboard)
  });
  try {
    return await makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const findOneDashboard = async (dashboardName: string, fullVisualizations: boolean = false) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/dashboard/${dashboardName}`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({ asJson: true }),
      body: JSON.stringify({ name: dashboardName, fullVisualizations })
    }
  );
  try {
    return await makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

export {
  browseDashboards,
  deleteDashboard,
  updateDashboard,
  createDashboard,
  findOneDashboard
};
