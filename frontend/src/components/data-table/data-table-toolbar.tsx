'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import type { Table } from '@tanstack/react-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ComponentType, MouseEventHandler, useCallback, useState, useTransition
} from 'react';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import DataTableFacetedFilter from '@/components/data-table/data-table-faceted-filter';
import DataTableViewOptions from '@/components/data-table/data-table-view-options';
import useDebounce from '@/lib/hooks/use-debounce';
import ActionButton from '../ui/table-action-button';

type SearchButtonProps = {
  containerStyles: string;
}

const SearchButton = ({ containerStyles }: SearchButtonProps) => (
  <button type="submit" className={`-ml-3 z-10 ${containerStyles}`}>
    <Image
      src="/magnifying-glass.svg"
      alt="magnifying glass"
      width={40}
      height={40}
      className="object-contain "
    />
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
}

const DataTableToolbar = <TData, >({
  table,
  filterableColumns = [],
  newRowLink,
  deleteRowsAction
}: DataTableToolbarProps<TData>) => {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState<string>('');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debouncedText = useDebounce(text, 500);

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
    <div className="flex w-full items-center justify-between space-x-2 overflow-auto p-1">
      <div className="flex flex-1 items-center space-x-2">
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
          className="flex items-center space-x-2" // Added flex container
        >
          <Input
            placeholder={'Filter ...'}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <SearchButton containerStyles="ml-[5%]" />
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
        {isFiltered && (
          <Button
            suppressHydrationWarning
            aria-label="Reset filters"
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={() => table.resetColumnFilters()}
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
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
