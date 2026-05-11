import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectTypes } from '@illustry/types';
import UpdateProjectForm from '@/components/form/update-project-form';
import { findOneProject } from '@/app/_actions/project';

const metadata: Metadata = {
  title: 'Update Project',
  description: 'Update a project'
};

type UpdateProjectPageProps = {
  params: Promise<{ projectName: string }>;
};

const UpdateProjectPage = async ({
  params
}: UpdateProjectPageProps) => {
  const { projectName } = await params;

  const currentProject = projectName
    ? (await findOneProject(projectName)) as ProjectTypes.ProjectType
    : undefined;

  if (!currentProject) {
    notFound();
  }
  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-[hsl(var(--illustry-section-background))] rounded-3xl shadow-[var(--illustry-shadow)]">
      <div className="space-y-2.5">
        <UpdateProjectForm project={currentProject} />
      </div>
    </div>
  );
};

export default UpdateProjectPage;
export { metadata };
