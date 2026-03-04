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

type VisualizationsTableShellProps = {
  data?: VisualizationTypes.VisualizationType[];
  pageCount?: number;
}

const VisualizationsTableShell = ({
  data,
  pageCount
}: VisualizationsTableShellProps) => {
  const [isPending, startTransition] = useTransition();
  const [selectedRowProperties, setSelectedRowProperties] = useState<
    { name: string; type: VisualizationTypes.VisualizationTypesEnum }[]
  >([]);
  const router = useRouter();
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
            aria-label="Select all"
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
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        )
      },
      {
        accessorKey: 'description',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        )
      },
      {
        accessorKey: 'type',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        )
      },
      {
        accessorKey: 'tags',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tags" />
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
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created At" />
        ),
        cell: ({ cell }) => formatDate(cell.getValue() as Date),
        enableColumnFilter: false
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated At" />
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
                aria-label="Open menu"
                variant="ghost"
                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
              >
                <DotsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem asChild>
                <Link
                  href={`/visualizationhub?name=${row.original.name}&type=${row.original.type}`}
                >
                  View
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  startTransition(() => {
                    row.toggleSelected(false);

                    toast.promise(
                      deleteVisualization({
                        name: row.original.name,
                        type: row.original.type
                      }),
                      {
                        loading: 'Deleting...',
                        success: () => { router.refresh(); return 'Visualization deleted successfully.' },
                        error: (err: unknown) => catchError(err)
                      }
                    );
                  });
                }}
                disabled={isPending}
              >
                Delete
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    ],
    [data, isPending]
  );

  const deleteSelectedRows = () => {
    toast.promise(
      Promise.all(
        selectedRowProperties.map(({ name, type }) => deleteVisualization({
          name,
          type
        }))
      ),
      {
        loading: 'Deleting...',
        success: () => {
          setSelectedRowProperties([]);
          router.refresh();
          return 'Visualizations deleted successfully.';
        },
        error: (err: unknown) => {
          setSelectedRowProperties([]);
          return catchError(err);
        }
      }
    );
  };

  return (
    <DataTable
      columns={columns}
      data={data as VisualizationTypes.VisualizationType[]}
      pageCount={pageCount as number}
      filterableColumns={[]}
      newRowLink="/visualizations/new"
      deleteRowsAction={deleteSelectedRows}
    />
  );
};

export default VisualizationsTableShell;
