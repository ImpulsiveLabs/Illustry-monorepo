'use client';

import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { type Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import HintTooltip from '@/components/ui/hint-tooltip';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/components/providers/locale-provider';

type DataTableViewOptionsProps<TData> = {
  table: Table<TData>;
}

const DataTableViewOptions = <TData, >({
  table
}: DataTableViewOptionsProps<TData>) => {
  const { t } = useLocale();

  return (
    <DropdownMenu>
      <HintTooltip text={t('tooltip.toggleColumns')}>
        <div>
          <DropdownMenuTrigger asChild>
            <Button
              suppressHydrationWarning
              aria-label={t('tooltip.toggleColumns')}
              variant="outline"
              size="sm"
              className="ml-auto hidden h-8 lg:flex"
            >
              <MixerHorizontalIcon className="mr-2 h-4 w-4" />
              {t('table.view')}
            </Button>
          </DropdownMenuTrigger>
        </div>
      </HintTooltip>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>{t('tooltip.toggleColumns')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) => typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DataTableViewOptions;
