import React from 'react';
import type { Metadata } from 'next';
import { ProjectTypes } from '@illustry/types';
import UpdateProjectForm from '@/components/form/update-project-form';
import { findOneProject } from '@/app/_actions/project';

const metadata: Metadata = {
  title: 'Update Project',
  description: 'Update a project'
};

type UpdateProjectPageProps = {
  params: {
    projectName: string;
  };
}

const UpdateProjectPage = async ({
  params
}: UpdateProjectPageProps) => {
  const currentProject = params && params.projectName
    ? await findOneProject(params.projectName) as ProjectTypes.ProjectType
    : undefined;
  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-gray-50 rounded-3xl dark:bg-gray-800">
      <div className="space-y-2.5">
        <UpdateProjectForm project={currentProject} />
      </div>
    </div>
  );
};

export default UpdateProjectPage;
export { metadata };
