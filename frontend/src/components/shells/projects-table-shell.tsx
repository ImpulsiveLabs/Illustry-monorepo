'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { toast } from 'sonner';
import { ProjectTypes } from '@illustry/types';
import {
  useMemo, useState, useTransition, useEffect
} from 'react';
import { deleteProject } from '@/app/_actions/project';
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
import { useActiveProjectDispatch } from '../providers/active-project-provider';
import { useRouter } from 'next/navigation';
import { useLocale } from '../providers/locale-provider';

type ProjectsTableShellProps = {
  data?: ProjectTypes.ProjectType[];
  pageCount?: number;
}

const ProjectsTableShell = ({ data, pageCount }: ProjectsTableShellProps) => {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [selectedRowNames, setSelectedRowNames] = useState<string[]>([]);
  const dispatch = useActiveProjectDispatch();
  const router = useRouter();

  useEffect(() => {
    if (dispatch) {
      const hasActiveProject = data?.some((project) => project.isActive) ?? false;
      dispatch({ type: 'SET_ACTIVE_PROJECT', payload: hasActiveProject });
    }
  }, [dispatch, data]);

  const columns = useMemo<ColumnDef<ProjectTypes.ProjectType, unknown>[]>(
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
        accessorKey: 'isActive',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('table.isActive')} />
        ),
        cell: ({ cell }) => (cell.getValue() ? t('table.active') : t('table.notActive')),
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
                <Link href={`/projects/${row.original.name}`}>{t('table.edit')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  startTransition(() => {
                    row.toggleSelected(false);

                    toast.promise(deleteProject(row.original.name), {
                      loading: t('table.deleting'),
                      success: () => { router.refresh(); return t('toast.projectDeleted'); },
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
      Promise.all(selectedRowNames.map((name) => deleteProject(name))),
      {
        loading: t('table.deleting'),
        success: () => {
          setSelectedRowNames([]);
          router.refresh();
          return t('toast.projectsDeleted');
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
      data={data as ProjectTypes.ProjectType[]}
      pageCount={pageCount as number}
      filterableColumns={[]}
      newRowLink="/projects/new"
      deleteRowsAction={deleteSelectedRows}
    />
  );
};

export default ProjectsTableShell;
