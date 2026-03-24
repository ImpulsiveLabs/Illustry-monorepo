import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState
} from '@tanstack/react-table';
import {
  ComponentType,
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import DataTablePagination from '@/components/data-table/data-table-pagination';
import DataTableToolbar from '@/components/data-table/data-table-toolbar';

type Option = {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
}

type DataTableSearchableColumn<TData> = {
  id: keyof TData;
  title: string;
}

type DataTableFilterableColumn<TData> = {
  options: Option[];
} & DataTableSearchableColumn<TData>

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  filterableColumns?: DataTableFilterableColumn<TData>[];
  newRowLink?: string;
  deleteRowsAction?: MouseEventHandler<HTMLButtonElement>;
}

const DataTable = <TData, TValue>({
  columns,
  data,
  pageCount,
  filterableColumns = [],
  newRowLink,
  deleteRowsAction
}: DataTableProps<TData, TValue>) => {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Search params
  const page = searchParams?.get('page') ?? '1';
  const perPage = searchParams?.get('per_page') ?? '10';
  const sort = searchParams?.get('sort');
  const [column, order] = sort?.split('.') ?? [];

  // Create query string
  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams?.toString());

      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      });

      return newSearchParams.toString();
    },
    [searchParams]
  );

  // Table states
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    []
  );

  // Handle server-side pagination
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: Number(page) - 1,
    pageSize: Number(perPage)
  });

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize
    }),
    [pageIndex, pageSize]
  );

  useEffect(() => {
    setPagination({
      pageIndex: Number(page) - 1,
      pageSize: Number(perPage)
    });
  }, [page, perPage]);

  useEffect(() => {
    router.push(
      `${pathname}?${createQueryString({
        page: pageIndex + 1,
        per_page: pageSize
      })}`,
      {
        scroll: false
      }
    );
  }, [pageIndex, pageSize]);

  // Handle server-side sorting
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: column ?? '',
      desc: order === 'desc'
    }
  ]);

  useEffect(() => {
    router.push(
      `${pathname}?${createQueryString({
        page,
        sort: sorting[0]?.id
          ? `${sorting[0]?.id}.${sorting[0]?.desc ? 'desc' : 'asc'}`
          : null
      })}`,
      {
        scroll: false
      }
    );
  }, [sorting]);

  // Handle server-side filtering

  const filterableColumnFilters = columnFilters.filter((filter) => filterableColumns.find((c) => c.id === filter.id));

  useEffect(() => {
    filterableColumnFilters.forEach((col) => {
      if (typeof col.value === 'object' && Array.isArray(col.value)) {
        router.push(
          `${pathname}?${createQueryString({
            page: 1,
            [col.id]: col.value.join('.')
          })}`,
          {
            scroll: false
          }
        );
      }
    });
    searchParams.forEach((value, key) => {
      const isFilterableColumn = filterableColumns.find((curColumn) => curColumn.id === key);
      const isFilterableColumnFilter = filterableColumnFilters.find((cur) => cur.id === key);
      if (isFilterableColumn && !isFilterableColumnFilter) {
        const params = {
          page: 1,
          [key]: null
        };
        router.push(`${pathname}?${createQueryString(params)}`, {
          scroll: false
        });
      }
    });
  }, [filterableColumnFilters]);

  const table = useReactTable({
    data: Array.isArray(data) ? data : [],
    columns,
    pageCount: pageCount ?? -1,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true
  });
  return (
    <div className="w-full space-y-3 overflow-auto">
      <DataTableToolbar
        table={table}
        filterableColumns={filterableColumns}
        deleteRowsAction={deleteRowsAction}
        newRowLink={newRowLink}
      />
      <div className="rounded-md border dark:border-gray-300">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t('table.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
};

export default DataTable;
