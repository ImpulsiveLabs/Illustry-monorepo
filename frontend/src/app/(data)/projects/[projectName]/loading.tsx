import React from 'react';
import { AppPage, PageSection } from '@/components/layouts/app-page';
import Skeleton from '@/components/ui/skeleton';

const ProjectLoading = () => (
    <AppPage>
      <PageSection className="p-4 md:p-6">
      
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6" />
      </PageSection>
    </AppPage>
  );

export default ProjectLoading;
