import React from 'react';
import DataTableLoading from '@/components/data-table/data-table-loading';

const DataLoading = () => (
    <DataTableLoading
      columnCount={6}
      isNewRowCreatable={true}
      isRowsDeletable={true}
    />
);

export default DataLoading;
