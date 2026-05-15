import React from 'react';
import { AppPage, PageSection } from '@/components/layouts/app-page';
import type { Metadata } from 'next';
import AddVisualizationForm from '@/components/form/add-visualization-form';

const metadata: Metadata = {
  title: 'New Visualization',
  description: 'Add some visualizations'
};

const NewVisualizationPage = () => (
  <AppPage>
      <PageSection className="p-4 md:p-6">
    
      <AddVisualizationForm />
      </PageSection>
    </AppPage>
  );

export default NewVisualizationPage;
export { metadata };
