'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { toast } from 'sonner';
import { VisualizationTypes } from '@illustry/types';
import { useMemo, useState, useTransition } from 'react';
import { deleteVisualization } from '@/app/_actions/visualization';
import { catchError, formatDate } from '@/lib/utils';
import DataTableColumnHeader from '../data-table/data-table-column-header';
import DataTable from '../data-table/data-table';
import Checkbox from '../ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useRouter } from 'next/navigation';
import { useLocale } from '../providers/locale-provider';
import ExternalInternalToggle from '../data-table/external-internal-toggle';
import ConfirmActionDialog from '@/components/ui/confirm-action-dialog';

type VisualizationsTableShellProps = {
  data?: VisualizationTypes.VisualizationType[];
  pageCount?: number;
  external?: boolean;
}

const VisualizationsTableShell = ({
  data,
  pageCount,
  external = false
}: VisualizationsTableShellProps) => {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [selectedRowProperties, setSelectedRowProperties] = useState<
    { name: string; type: VisualizationTypes.VisualizationTypesEnum }[]
  >([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'single' | 'selected';
    value?: Parameters<typeof deleteVisualization>[0];
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const requestDelete = (target: {
    type: 'single' | 'selected';
    value?: Parameters<typeof deleteVisualization>[0];
  }) => {
    setDeleteTarget(target);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    const target = deleteTarget;
    if (!target) {
      return;
    }

    startTransition(() => {
      const promise = target.type === 'single' && target.value
        ? deleteVisualization(target.value)
        : Promise.all(
          selectedRowProperties.map(({ name, type }) => deleteVisualization({
            name,
            type
          }))
        );

      toast.promise(Promise.resolve(promise), {
        loading: t('table.deleting'),
        success: () => {
          setSelectedRowProperties([]);
          setDeleteTarget(null);
          setDeleteDialogOpen(false);
          router.refresh();
          return target.type === 'single' ? t('toast.visualizationDeleted') : t('toast.visualizationsDeleted');
        },
        error: (err: unknown) => {
          setSelectedRowProperties([]);
          setDeleteTarget(null);
          setDeleteDialogOpen(false);
          return catchError(err);
        }
      });
    });
  };
  const columns = useMemo<ColumnDef<VisualizationTypes.VisualizationType, unknown>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (data) {
                setSelectedRowProperties(
                  (p: { name: string; type: VisualizationTypes.VisualizationTypesEnum }[]) => (p.length === data.length
                    ? []
                    : data.map(
                      (row) => ({ name: row.name, type: row.type } as {
                        name: string;
                        type: VisualizationTypes.VisualizationTypesEnum;
                      })
                    ))
                );
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
              setSelectedRowProperties(
                (prev: { name: string; type: VisualizationTypes.VisualizationTypesEnum }[]) => (value
                  ? [
                    ...prev,
                    {
                      name: row.original.name,
                      type: row.original.type
                    } as { name: string; type: VisualizationTypes.VisualizationTypesEnum }
                  ]
                  : prev.filter(
                    (id) => id.name !== row.original.name
                      && id.type !== row.original.type
                  ))
              );
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
        accessorKey: 'type',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('common.type')} />
        )
      },
      {
        accessorKey: 'tags',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('table.tags')} />
        ),
        cell: ({ cell }) => {
          const tags = cell.getValue();

          if (typeof tags === 'string') {
            return (
              <Badge variant="outline" className="capitalize">
                {tags}
              </Badge>
            );
          }

          if (Array.isArray(tags)) {
            return tags.map(
              (
                tag // Add the return statement here
              ) => (
                <Badge key={tag} variant="outline" className="capitalize ml-1">
                  {tag}
                </Badge>
              )
            );
          }

          return null;
        }
      },
      ...(external ? [
        {
          accessorKey: 'ownerEmail',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('table.owner')} />
          )
        } as ColumnDef<VisualizationTypes.VisualizationType, unknown>,
        {
          accessorKey: 'currentUserRole',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('table.myRole')} />
          )
        } as ColumnDef<VisualizationTypes.VisualizationType, unknown>
      ] : []),
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
	                  href={row.original.shareId && row.original.isExternal
	                      ? `/visualizationhub?share=${row.original.shareId}`
	                      : `/visualizationhub?name=${row.original.name}&type=${row.original.type}`}
	                >
                  {t('table.view')}
                </Link>
              </DropdownMenuItem>

	              {!external && (
	                <>
	                  <DropdownMenuSeparator />
		                  <DropdownMenuItem asChild>
		                    <Link
		                      href={`/share/visualization?name=${encodeURIComponent(row.original.name)}&type=${encodeURIComponent(String(row.original.type))}`}
		                    >
		                      {t('common.share')}
		                    </Link>
		                  </DropdownMenuItem>
	                </>
	              )}

	              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  row.toggleSelected(false);
                  requestDelete({
                    type: 'single',
                    value: {
                      name: row.original.isExternal ? undefined : row.original.name,
                      type: row.original.isExternal ? undefined : row.original.type,
                      shareId: row.original.isExternal ? row.original.shareId : undefined
                    }
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
    [data, external, isPending, t]
  );

  const deleteSelectedRows = () => {
    if (selectedRowProperties.length) {
      requestDelete({ type: 'selected' });
    }
  };

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={data as VisualizationTypes.VisualizationType[]}
        pageCount={pageCount as number}
        filterableColumns={[]}
        newRowLink={external ? undefined : '/visualizations?modal=new'}
        deleteRowsAction={external ? undefined : deleteSelectedRows}
        toolbarActions={<ExternalInternalToggle mode={external ? 'external' : 'owned'} />}
      />
      <ConfirmActionDialog
        open={deleteDialogOpen}
        pending={isPending}
        description={t(deleteTarget?.type === 'selected'
          ? 'confirm.deleteVisualizationsDescription'
          : 'confirm.deleteVisualizationDescription')}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default VisualizationsTableShell;
