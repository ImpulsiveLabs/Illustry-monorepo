import React from 'react';
import type { Metadata } from 'next';
import AddVisualizationForm from '@/components/form/add-visualization-form';

const metadata: Metadata = {
  title: 'New Visualization',
  description: 'Add some visualizations'
};

const NewVisualizationPage = () => (
  <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-gray-50 rounded-3xl dark:bg-gray-800">
    <div className="space-y-2.5">
      <AddVisualizationForm />
    </div>
  </div>
);

export default NewVisualizationPage;
export { metadata };
