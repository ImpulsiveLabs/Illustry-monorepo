'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import type { Table } from '@tanstack/react-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ComponentType, MouseEventHandler, ReactNode, useCallback, useState, useTransition
} from 'react';
import { Button } from '@/components/ui/button';
import HintTooltip from '@/components/ui/hint-tooltip';
import Input from '@/components/ui/input';
import DataTableFacetedFilter from '@/components/data-table/data-table-faceted-filter';
import DataTableViewOptions from '@/components/data-table/data-table-view-options';
import useDebounce from '@/lib/hooks/use-debounce';
import { useLocale } from '@/components/providers/locale-provider';
import ActionButton from '../ui/table-action-button';
import Icons from '../icons';

type SearchButtonProps = {
  containerStyles: string;
}

const SearchButton = ({ containerStyles }: SearchButtonProps) => (
  <button
    type="submit"
    className={`z-10 inline-flex h-9 w-9 items-center justify-center rounded-[var(--illustry-button-radius)] border border-input bg-background/70 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 ${containerStyles}`}
  >
    <Icons.search className="h-4 w-4" aria-hidden="true" />
  </button>
);
type Option = {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
}

type DataTableSearchableColumn<TData> = {
  id: keyof TData;
  title: string;
}

type DataTableFilterableColumn<TData, > = {
  options: Option[];
} & DataTableSearchableColumn<TData>

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  filterableColumns?: DataTableFilterableColumn<TData>[];
  newRowLink?: string;
  deleteRowsAction?: MouseEventHandler<HTMLButtonElement>;
  toolbarActions?: ReactNode;
}

const DataTableToolbar = <TData, >({
  table,
  filterableColumns = [],
  newRowLink,
  deleteRowsAction,
  toolbarActions
}: DataTableToolbarProps<TData>) => {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState<string>('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debouncedText = useDebounce(text, 500);
  const { t } = useLocale();

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

  return (
    <div className="flex w-full items-center justify-between gap-2 overflow-auto p-1">
      <div className="flex flex-1 items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(
              `${pathname}?${createQueryString({
                page: 1,
                text: debouncedText.length > 0 ? debouncedText : null
              })}`,
              {
                scroll: false
              }
            );
          }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder={t('table.filterPlaceholder')}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="h-9 w-[160px] lg:w-[260px]"
          />
          <SearchButton containerStyles="" />
        </form>
        {filterableColumns.length > 0
          && filterableColumns.map(
            (column) => table.getColumn(column.id ? String(column.id) : '') && (
              <DataTableFacetedFilter
                key={String(column.id)}
                column={table.getColumn(column.id ? String(column.id) : '')}
                title={column.title}
                options={column.options}
              />
            )
          )}
        {toolbarActions}
        {isFiltered && (
          <HintTooltip text={t('tooltip.resetFilters')}>
            <Button
              suppressHydrationWarning
              aria-label={t('tooltip.resetFilters')}
              variant="ghost"
              className="h-8 px-2 lg:px-3"
              onClick={() => table.resetColumnFilters()}
            >
              {t('table.reset')}
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          </HintTooltip>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <ActionButton
          deleteRowsAction={deleteRowsAction}
          table={table}
          isPending={isPending}
          newRowLink={newRowLink}
          startTransition={startTransition}
        />
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
};

export default DataTableToolbar;
export type { DataTableToolbarProps };
