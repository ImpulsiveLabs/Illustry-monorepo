'use client';

import { MouseEventHandler, TransitionStartFunction } from 'react';
import { PlusCircledIcon, TrashIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import type { Table } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { useLocale } from '@/components/providers/locale-provider';
import HintTooltip from '@/components/ui/hint-tooltip';
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
  const { t } = useLocale();
  const handleDeleteClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    startTransition(() => {
      table.toggleAllPageRowsSelected(false);
      deleteRowsAction?.(event);
    });
  };

  if (deleteRowsAction && table.getSelectedRowModel().rows.length > 0) {
    return (
      <HintTooltip text={t('tooltip.deleteSelectedRows')}>
        <Button
          suppressHydrationWarning
          aria-label={t('tooltip.deleteSelectedRows')}
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleDeleteClick}
          disabled={isPending}
        >
          <TrashIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('table.delete')}
        </Button>
      </HintTooltip>
    );
  }

  if (newRowLink) {
    return (
      <HintTooltip text={t('tooltip.createNewRow')}>
        <Link aria-label={t('tooltip.createNewRow')} href={newRowLink}>
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
            {t('table.new')}
          </div>
        </Link>
      </HintTooltip>
    );
  }

  return null;
};

export default ActionButton;
