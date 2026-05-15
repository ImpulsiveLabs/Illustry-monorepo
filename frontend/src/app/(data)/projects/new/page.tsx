import React from 'react';
import { AppPage, PageSection } from '@/components/layouts/app-page';
import type { Metadata } from 'next';
import AddProjectForm from '@/components/form/add-project-form';

const metadata: Metadata = {
  title: 'New Project',
  description: 'Add a new project'
};

const NewProjectPage = () => (
  <AppPage>
      <PageSection className="p-4 md:p-6">
    
      <AddProjectForm />
      </PageSection>
    </AppPage>
  );

export default NewProjectPage;
export { metadata };
