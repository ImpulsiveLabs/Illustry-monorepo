'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon
} from '@radix-ui/react-icons';
import { type Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import HintTooltip from '@/components/ui/hint-tooltip';
import { useLocale } from '@/components/providers/locale-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

const DataTablePagination = <TData, >({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50]
}: DataTablePaginationProps<TData>) => {
  const { t } = useLocale();
  return (
    <div className="flex w-full flex-col items-center justify-between gap-4 overflow-auto px-2 py-1 sm:flex-row sm:gap-8">
      <div className="flex-1 whitespace-nowrap text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} /{' '}
        {table.getFilteredRowModel().rows.length} {t('table.rowsSelected')}
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
        <div className="flex items-center space-x-2">
          <p className="whitespace-nowrap text-sm font-medium ">{t('table.rowsPerPage')}</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value: string | number) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px] dark:border-gray-300">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          {t('table.page')} {table.getState().pagination.pageIndex + 1} {t('table.of')}{' '}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <HintTooltip text={t('tooltip.goToFirstPage')}>
            <Button
              suppressHydrationWarning
              aria-label={t('tooltip.goToFirstPage')}
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </HintTooltip>
          <HintTooltip text={t('tooltip.goToPreviousPage')}>
            <Button
              suppressHydrationWarning
              aria-label={t('tooltip.goToPreviousPage')}
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </HintTooltip>
          <HintTooltip text={t('tooltip.goToNextPage')}>
            <Button
              suppressHydrationWarning
              aria-label={t('tooltip.goToNextPage')}
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </HintTooltip>
          <HintTooltip text={t('tooltip.goToLastPage')}>
            <Button
              suppressHydrationWarning
              aria-label={t('tooltip.goToLastPage')}
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <DoubleArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </HintTooltip>
        </div>
      </div>
    </div>
  );
};

export default DataTablePagination;
