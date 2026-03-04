import React from 'react';
import type { Metadata } from 'next';
import type { ProjectTypes } from '@illustry/types';
import { browseProjects } from '@/app/_actions/project';
import ProjectsTableShell from '@/components/shells/projects-table-shell';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Manage your projects',
};

type ProjectsProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
    page?: string;
    text?: string;
    per_page?: string;
    sort?: string;
  }>;
};

const ProjectsPage = async ({ searchParams }: ProjectsProps) => {
  const sp = await searchParams;

  const page = typeof sp.page === 'string' ? sp.page : undefined;
  const text = typeof sp.text === 'string' ? sp.text : undefined;
  const perPage = typeof sp.per_page === 'string' ? sp.per_page : undefined;
  const sort = typeof sp.sort === 'string' ? sp.sort : undefined;

  const projects = await browseProjects({
    page: page ? Number(page) : 1,
    text,
    per_page: perPage ? Number(perPage) : 10,
    sort: sort
      ? {
          sortOrder: sort.split('.')[1] === 'asc' ? 1 : -1,
          element: sort.split('.')[0],
        }
      : undefined,
  } as ProjectTypes.ProjectFilter);

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-gray-50 rounded-3xl dark:bg-gray-800">
      <div className="space-y-2.5">
        <ProjectsTableShell
          data={projects ? projects.projects : []}
          pageCount={projects ? Math.ceil(projects.pagination?.pageCount as number) : 1}
        />
      </div>
    </div>
  );
};

export default ProjectsPage;
