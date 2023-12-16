'use client';

import { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';
import { catchError, formatDate } from '@/lib/utils';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { toast } from 'sonner';
import { deleteProject } from '@/app/_actions/project';
import { ProjectType } from 'types/project';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Checkbox } from '../ui/checkbox';
import { DataTable } from '../data-table/data-table';
import { DataTableColumnHeader } from '../data-table/data-table-column-header';

interface ProjectsTableShellProps {
  data?: ProjectType[];
  pageCount?: number;
}
export function ProjectsTableShell({
  data,
  pageCount
}: ProjectsTableShellProps) {
  const [isPending, startTransition] = React.useTransition();
  const [selectedRowNames, setSelectedRowNames] = React.useState<string[]>([]);
  const columns = React.useMemo<ColumnDef<ProjectType, unknown>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (data) {
                setSelectedRowNames((prev) => (prev.length === data.length ? [] : data.map((row) => row.name)));
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
              setSelectedRowNames((prev) => (value
                ? [...prev, row.original.name]
                : prev.filter((id) => id !== row.original.name)));
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
        accessorKey: 'isActive',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Is Active" />
        ),
        cell: ({ cell }) => (cell.getValue() ? 'active' : 'not active'),
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
                <Link href={`/projects/${row.original.name}`}>Edit</Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  startTransition(() => {
                    row.toggleSelected(false);

                    toast.promise(deleteProject(row.original.name), {
                      loading: 'Deleting...',
                      success: () => 'Project deleted successfully.',
                      error: (err: unknown) => catchError(err)
                    });
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
  function deleteSelectedRows() {
    toast.promise(
      Promise.all(selectedRowNames.map((name) => deleteProject(name))),
      {
        loading: 'Deleting...',
        success: () => {
          setSelectedRowNames([]);
          return 'Projects deleted successfully.';
        },
        error: (err: unknown) => {
          setSelectedRowNames([]);
          return catchError(err);
        }
      }
    );
  }
  return (
    <DataTable
      columns={columns}
      data={data as ProjectType[]}
      pageCount={pageCount as number}
      filterableColumns={[]}
      newRowLink="/projects/new"
      deleteRowsAction={deleteSelectedRows}
    />
  );
}
