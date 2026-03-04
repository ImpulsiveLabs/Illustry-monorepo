/* eslint-disable no-console */

'use server';

import 'dotenv/config';
import { DashboardTypes } from '@illustry/types';
import makeRequest from '@/lib/request';

function getBackendUrl() {
  const url = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL;
  if (!url) {
    throw new Error('Backend URL is not set (BACKEND_INTERNAL_URL or NEXT_PUBLIC_BACKEND_PUBLIC_URL)');
  }
  return url;
}

const BACKEND = getBackendUrl() as string;

const browseDashboards = async (filter?: DashboardTypes.DashboardFilter) => {
  let newFilter: DashboardTypes.DashboardFilter = {};

  if (filter) {
    newFilter = filter;
  }
  const request = new Request(`${BACKEND as string}/api/dashboards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newFilter)
  });
  try {
    return makeRequest<DashboardTypes.ExtendedDashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const deleteDashboard = async (dashboardName: string) => {
  const request = new Request(`${BACKEND as string}/api/dashboard`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: dashboardName
    })
  });
  try {
    return makeRequest<boolean>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const updateDashboard = async (dashboard: DashboardTypes.DashboardUpdate) => {
  const request = new Request(`${BACKEND as string}/api/dashboard`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dashboard)
  });
  try {
    return makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const createDashboard = async (dashboard: DashboardTypes.DashboardCreate) => {
  const newDashboard = {
    projectName: dashboard.projectName,
    visualizations: dashboard.visualizations,
    description: dashboard.description,
    name: dashboard.name
  };
  const request = new Request(`${BACKEND as string}/api/dashboard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newDashboard)
  });
  try {
    return makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const findOneDashboard = async (dashboardName: string, fullVisualizations: boolean = false) => {
  const request = new Request(
    `${BACKEND as string}/api/dashboard/${dashboardName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: dashboardName, fullVisualizations })
    }
  );
  try {
    return makeRequest<DashboardTypes.DashboardType>(request, ['dashboards']);
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
