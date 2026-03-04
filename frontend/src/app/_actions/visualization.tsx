/* eslint-disable no-console */

'use server';

import 'dotenv/config';
import {
  VisualizationTypes
} from '@illustry/types';
import makeRequest from '@/lib/request';
import getBackendUrl from '@/lib/backend-url';


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
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(newFilter)
    }
  );
  try {
    return makeRequest<VisualizationTypes.ExtendedVisualizationType>(request, ['visualizations']);
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(visualizationFilter)
    }
  );
  try {
    return makeRequest<boolean>(request, ['visualizations']);
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
      body: form
    }
  );
  try {
    return makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(visualizationFilter)
    }
  );
  try {
    return makeRequest<VisualizationTypes.VisualizationType>(request, ['visualizations']);
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
