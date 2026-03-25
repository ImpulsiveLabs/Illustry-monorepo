'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { toast } from 'sonner';
import { DashboardTypes } from '@illustry/types';
import { useMemo, useState, useTransition } from 'react';
import { deleteDashboard } from '@/app/_actions/dashboard';
import { catchError, formatDate } from '@/lib/utils';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import Checkbox from '../ui/checkbox';
import DataTable from '../data-table/data-table';
import DataTableColumnHeader from '../data-table/data-table-column-header';
import { useRouter } from 'next/navigation';
import { useLocale } from '../providers/locale-provider';

type DashboardsTableShellProps = {
  data?: DashboardTypes.DashboardType[];
  pageCount?: number;
}

const DashboardsTableShell = ({ data, pageCount }: DashboardsTableShellProps) => {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [selectedRowNames, setSelectedRowNames] = useState<string[]>([]);
  const router = useRouter();
  const columns = useMemo<ColumnDef<DashboardTypes.DashboardType, unknown>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (data) {
                // eslint-disable-next-line max-len
                setSelectedRowNames((prev) => (prev.length === data.length ? [] : data.map((row) => row.name)));
              }
            }}
            aria-label={t('tooltip.selectAllRows')}
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
              setSelectedRowNames((prev) => (value
                ? [...prev, row.original.name]
                : prev.filter((id) => id !== row.original.name)));
            }}
            aria-label={t('tooltip.selectRow')}
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('common.name')} />
        )
      },
      {
        accessorKey: 'description',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('common.description')} />
        )
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('table.createdAt')} />
        ),
        cell: ({ cell }) => formatDate(cell.getValue() as Date),
        enableColumnFilter: false
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('table.updatedAt')} />
        ),
        cell: ({ cell }) => formatDate(cell.getValue() as Date),
        enableColumnFilter: false
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={t('tooltip.openRowMenu')}
                variant="ghost"
                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
              >
                <DotsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboardhub?name=${row.original.name}`}
                >
                  {t('table.view')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/dashboards/${row.original.name}`}>{t('table.edit')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  startTransition(() => {
                    row.toggleSelected(false);
                    toast.promise(deleteDashboard(row.original.name), {
                      loading: t('table.deleting'),
                      success: () => { router.refresh(); return t('toast.dashboardDeleted');},
                      error: (err: unknown) => catchError(err)
                    });
                  });
                }}
                disabled={isPending}
              >
                {t('table.delete')}
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    ],
    [data, isPending, t]
  );

  const deleteSelectedRows = () => {
    toast.promise(
      Promise.all(selectedRowNames.map((name) => deleteDashboard(name))),
      {
        loading: t('table.deleting'),
        success: () => {
          setSelectedRowNames([]);
          router.refresh();
          return t('toast.dashboardsDeleted');
        },
        error: (err: unknown) => {
          setSelectedRowNames([]);
          return catchError(err);
        }
      }
    );
  };

  return (
    <DataTable
      columns={columns}
      data={data as DashboardTypes.DashboardType[]}
      pageCount={pageCount as number}
      filterableColumns={[]}
      newRowLink="/dashboards/new"
      deleteRowsAction={deleteSelectedRows}
    />
  );
};

export default DashboardsTableShell;
