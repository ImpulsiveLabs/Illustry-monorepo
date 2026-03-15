import { MouseEventHandler, TransitionStartFunction } from 'react';
import { PlusCircledIcon, TrashIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import type { Table } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from './button';

type ActionButtonProps<TData> = {
  table: Table<TData>;
  newRowLink?: string;
  isPending: boolean;
  deleteRowsAction?: MouseEventHandler<HTMLButtonElement>;
  startTransition: TransitionStartFunction
}

const ActionButton = <TData, >({
  deleteRowsAction,
  table,
  isPending,
  newRowLink,
  startTransition
}: ActionButtonProps<TData>) => {
  const handleDeleteClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    startTransition(() => {
      table.toggleAllPageRowsSelected(false);
      deleteRowsAction?.(event);
    });
  };

  if (deleteRowsAction && table.getSelectedRowModel().rows.length > 0) {
    return (
      <Button
        suppressHydrationWarning
        aria-label="Delete selected rows"
        variant="outline"
        size="sm"
        className="h-8"
        onClick={handleDeleteClick}
        disabled={isPending}
      >
        <TrashIcon className="mr-2 h-4 w-4" aria-hidden="true" />
        Delete
      </Button>
    );
  }

  if (newRowLink) {
    return (
      <Link aria-label="Create new row" href={newRowLink}>
        <div
          className={cn(
            buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'h-8'
            })
          )}
        >
          <PlusCircledIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          New
        </div>
      </Link>
    );
  }

  return null;
};

export default ActionButton;
