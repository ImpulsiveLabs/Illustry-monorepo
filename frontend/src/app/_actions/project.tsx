/* eslint-disable no-console */

'use server';

import 'dotenv/config';
import { revalidateTag } from 'next/cache';
import { ProjectTypes } from '@illustry/types';
import makeRequest from '@/lib/request';

const browseProjects = async (filter?: ProjectTypes.ProjectFilter) => {
  revalidateTag('projects');
  let newFilter: ProjectTypes.ProjectFilter = {};

  if (filter) {
    newFilter = filter;
  }
  const request = new Request(`${process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL as string}/api/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newFilter)
  });
  try {
    return makeRequest<ProjectTypes.ExtendedProjectType>(request, ['projects']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const deleteProject = async (projectName: string) => {
  revalidateTag('projects');
  const request = new Request(`${process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL as string}/api/project`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: projectName
    })
  });
  try {
    return makeRequest<boolean>(request, ['projects']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const updateProject = async (project: ProjectTypes.ProjectUpdate) => {
  revalidateTag('projects');
  const request = new Request(`${process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL as string}/api/project`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(project)
  });
  try {
    return makeRequest<ProjectTypes.ProjectType>(request, ['projects']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const createProject = async (project: ProjectTypes.ProjectCreate) => {
  const newProject = {
    projectName: project.name,
    projectDescription: project.description,
    isActive: project.isActive
  };
  const request = new Request(`${process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL as string}/api/project`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newProject)
  });
  try {
    return makeRequest<ProjectTypes.ProjectType>(request, ['projects']);
  } catch (err) {
    console.debug(err);
    return null;
  }
};

const findOneProject = async (projectName: string) => {
  const request = new Request(
    `${process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL as string}/api/project/${projectName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: projectName })
    }
  );
  try {
    return makeRequest<ProjectTypes.ProjectType>(request, ['projects']);
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
