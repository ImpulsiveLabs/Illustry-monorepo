import {
  ArrowDownIcon,
  ArrowUpIcon,
  CaretSortIcon,
  EyeNoneIcon
} from '@radix-ui/react-icons';
import { type Column } from '@tanstack/react-table';
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type DataTableColumnHeaderProps<TData, TValue>
  = {
    column: Column<TData, TValue>;
    title: string;
  } & React.HTMLAttributes<HTMLDivElement>

const DataTableColumnHeader = <TData, TValue>({
  column,
  title,
  className
}: DataTableColumnHeaderProps<TData, TValue>) => {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }
  const handleSorted = (columnProps: Column<TData, TValue>) => {
    let areaLabelSortedColumn = 'Not sorted. Click to sort ascending.';
    let arrowSortedColumn = (
      <CaretSortIcon className="ml-2 h-4 w-4" aria-hidden="true" />
    );

    if (columnProps.getIsSorted() === 'desc') {
      areaLabelSortedColumn = 'Sorted descending. Click to sort ascending.';
      arrowSortedColumn = (
        <ArrowDownIcon className="ml-2 h-4 w-4" aria-hidden="true" />
      );
    } else if (columnProps.getIsSorted() === 'asc') {
      areaLabelSortedColumn = 'Sorted ascending. Click to sort descending.';
      arrowSortedColumn = (
        <ArrowUpIcon className="ml-2 h-4 w-4" aria-hidden="true" />
      );
    }
    return { areaLabelSortedColumn, arrowSortedColumn };
  };
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            suppressHydrationWarning
            aria-label={handleSorted(column).areaLabelSortedColumn}
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {handleSorted(column).arrowSortedColumn}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            aria-label="Sort ascending"
            onClick={() => column.toggleSorting(false)}
          >
            <ArrowUpIcon
              className="mr-2 h-3.5 w-3.5 text-muted-foreground/70"
              aria-hidden="true"
            />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem
            aria-label="Sort descending"
            onClick={() => column.toggleSorting(true)}
          >
            <ArrowDownIcon
              className="mr-2 h-3.5 w-3.5 text-muted-foreground/70"
              aria-hidden="true"
            />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            aria-label="Hide column"
            onClick={() => column.toggleVisibility(false)}
          >
            <EyeNoneIcon
              className="mr-2 h-3.5 w-3.5 text-muted-foreground/70"
              aria-hidden="true"
            />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DataTableColumnHeader;
