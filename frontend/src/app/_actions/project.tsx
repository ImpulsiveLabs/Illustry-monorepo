/* eslint-disable no-console */

'use server';

import 'dotenv/config';
import { ProjectTypes } from '@illustry/types';
import makeRequest from '@/lib/request';
import getBackendUrl from '@/lib/backend-url';
import { buildBackendHeaders } from '@/lib/auth-request';


const browseProjects = async (filter?: ProjectTypes.ProjectFilter) => {
  const BACKEND = getBackendUrl() as string;

  let newFilter: ProjectTypes.ProjectFilter = {};

  if (filter) {
    newFilter = filter;
  }
  const request = new Request(`${BACKEND as string}/api/projects`, {
    method: 'POST',
    headers: await buildBackendHeaders({ asJson: true }),
    body: JSON.stringify(newFilter)
  });
  try {
    return await makeRequest<ProjectTypes.ExtendedProjectType>(request, ['projects']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const deleteProject = async (projectName: string) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(`${BACKEND as string}/api/project`, {
    method: 'DELETE',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify({
      name: projectName
    })
  });
  try {
    return await makeRequest<boolean>(request, ['projects']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const updateProject = async (project: ProjectTypes.ProjectUpdate) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(`${BACKEND as string}/api/project`, {
    method: 'PUT',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(project)
  });
  try {
    return await makeRequest<ProjectTypes.ProjectType>(request, ['projects']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const createProject = async (project: ProjectTypes.ProjectCreate) => {
  const BACKEND = getBackendUrl() as string;

  const newProject = {
    projectName: project.name,
    projectDescription: project.description,
    isActive: project.isActive
  };
  const request = new Request(`${BACKEND as string}/api/project`, {
    method: 'POST',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(newProject)
  });
  try {
    return await makeRequest<ProjectTypes.ProjectType>(request, ['projects']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const findOneProject = async (projectName: string) => {
  const BACKEND = getBackendUrl() as string;

  const request = new Request(
    `${BACKEND as string}/api/project/${projectName}`,
    {
      method: 'POST',
      headers: await buildBackendHeaders({ asJson: true }),
      body: JSON.stringify({ name: projectName })
    }
  );
  try {
    return await makeRequest<ProjectTypes.ProjectType>(request, ['projects']);
  } catch (err) {
    return null;
  }
};

export {
  createProject,
  browseProjects,
  deleteProject,
  updateProject,
  findOneProject
};
