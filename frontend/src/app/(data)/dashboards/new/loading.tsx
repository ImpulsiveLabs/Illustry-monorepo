import React from 'react';
import Skeleton from '@/components/ui/skeleton';

const NewDashboardLoading = () => (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-[hsl(var(--illustry-section-background))] rounded-3xl shadow-[var(--illustry-shadow)]">
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6" />
      </div>
    </div>
);

export default NewDashboardLoading;
