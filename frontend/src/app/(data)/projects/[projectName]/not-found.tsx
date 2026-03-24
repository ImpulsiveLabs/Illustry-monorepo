'use client';

import React from 'react';
import { Shell } from '@/components/shells/shell';
import ErrorCard from '@/components/ui/error-card';
import { useLocale } from '@/components/providers/locale-provider';

const ProjectNotFound = () => {
  const { t } = useLocale();
  return (
      <Shell variant="centered">
        <ErrorCard
          title={t('error.projectNotFoundTitle')}
          description={t('error.projectExpiredDescription')}
          retryLink={'/projects'}
          retryLinkText={t('error.goToProjects')}
        />
      </Shell>
  );
};

export default ProjectNotFound;
