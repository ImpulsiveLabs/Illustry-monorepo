/* eslint-disable no-console */

'use server';

import 'dotenv/config';
import {
  VisualizationTypes
} from '@illustry/types';
import makeRequest from '@/lib/request';
import getBackendUrl from '@/lib/backend-url';
import { buildBackendHeaders } from '@/lib/auth-request';


const browseVisualizations = async (filter?: VisualizationTypes.VisualizationFilter) => {
  const BACKEND = getBackendUrl() as string;

  let newFilter: VisualizationTypes.VisualizationFilter = {};
  if (filter) {
    newFilter = filter;
  }
  const request = new Request(
    `${BACKEND as string}/api/visualizations`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({
        asJson: true,
        extraHeaders: {
          'Cache-Control': 'no-cache'
        }
      }),
      body: JSON.stringify(newFilter)
    }
  );
  try {
    return await makeRequest<VisualizationTypes.ExtendedVisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const deleteVisualization = async (
  visualizationFilter: VisualizationTypes.VisualizationFilter
) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization`,
    {
      method: 'DELETE',
      headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
      body: JSON.stringify(visualizationFilter)
    }
  );
  try {
    return await makeRequest<boolean>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const createOrUpdateVisualization = async (
  form: FormData
) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({ asJson: false, withCsrf: true }),
      body: form
    }
  );
  try {
    return await makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const findOneVisualization = async (
  visualizationFilter: VisualizationTypes.VisualizationFilter
) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/visualization/${visualizationFilter.name}`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({ asJson: true }),
      body: JSON.stringify(visualizationFilter)
    }
  );
  try {
    return await makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

export {
  browseVisualizations,
  deleteVisualization,
  createOrUpdateVisualization,
  findOneVisualization
};
