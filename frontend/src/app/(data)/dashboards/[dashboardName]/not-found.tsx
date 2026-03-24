'use client';

import React from 'react';
import { Shell } from '@/components/shells/shell';
import ErrorCard from '@/components/ui/error-card';
import { useLocale } from '@/components/providers/locale-provider';

const DashboardNotFound = () => {
  const { t } = useLocale();

  return (
      <Shell variant="centered">
        <ErrorCard
          title={t('error.dashboardNotFoundTitle')}
          description={t('error.dashboardExpiredDescription')}
          retryLink={'/dashboards'}
          retryLinkText={t('error.goToDashboards')}
        />
      </Shell>
  );
};

export default DashboardNotFound;
