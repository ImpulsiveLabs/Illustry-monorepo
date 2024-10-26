import DataTableLoading from '@/components/data-table/data-table-loading';

const ProjectsLoading = () => (
    <DataTableLoading
      columnCount={6}
      isNewRowCreatable={true}
      isRowsDeletable={true}
    />
);

export default ProjectsLoading;
