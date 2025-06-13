import React from 'react';
import Skeleton from '@/components/ui/skeleton';

const NewProjectLoading = () => (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-gray-50 rounded-3xl dark:bg-gray-800">
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6" />
      </div>
    </div>
);

export default NewProjectLoading;
