import React from 'react';
import { Shell } from '@/components/shells/shell';
import ErrorCard from '@/components/ui/error-card';

const ProjectNotFound = () => (
    <Shell variant="centered">
      <ErrorCard
        title="Project not found"
        description="The Project may have expired "
        retryLink={'/projects'}
        retryLinkText="Go to Projects"
      />
    </Shell>
);

export default ProjectNotFound;
