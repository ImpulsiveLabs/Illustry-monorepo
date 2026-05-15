import React from 'react';
import { AppPage, PageSection } from '@/components/layouts/app-page';
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
    <AppPage>
      <PageSection className="p-4 md:p-6">
      
        <UpdateProjectForm project={currentProject} />
      </PageSection>
    </AppPage>
  );
};

export default UpdateProjectPage;
export { metadata };
