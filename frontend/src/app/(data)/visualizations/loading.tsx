import React from 'react';
import DataTableLoading from '@/components/data-table/data-table-loading';

const VisualizationsLoading = () => (
    <DataTableLoading
      columnCount={6}
      isNewRowCreatable={true}
      isRowsDeletable={true}
    />
);

export default VisualizationsLoading;
