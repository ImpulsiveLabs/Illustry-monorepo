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
import ConfirmActionDialog from '@/components/ui/confirm-action-dialog';
import { closeRealtimeSocket, getRealtimeClientId, type RealtimePayload } from '@/lib/realtime-client';

type ProjectsTableShellProps = {
  data?: ProjectTypes.ProjectType[];
  pageCount?: number;
}

const ProjectsTableShell = ({ data, pageCount }: ProjectsTableShellProps) => {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [selectedRowNames, setSelectedRowNames] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'selected'; name?: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const dispatch = useActiveProjectDispatch();
  const router = useRouter();
  const realtimeClientId = useMemo(() => getRealtimeClientId(), []);

  const requestDelete = (target: { type: 'single' | 'selected'; name?: string }) => {
    setDeleteTarget(target);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    const target = deleteTarget;
    if (!target) {
      return;
    }

    startTransition(() => {
      const names = target.type === 'single' && target.name ? [target.name] : selectedRowNames;
      toast.promise(
        Promise.all(names.map((name) => deleteProject(name))),
        {
          loading: t('table.deleting'),
          success: () => {
            setSelectedRowNames([]);
            setDeleteTarget(null);
            setDeleteDialogOpen(false);
            router.refresh();
            return target.type === 'single' ? t('toast.projectDeleted') : t('toast.projectsDeleted');
          },
          error: (err: unknown) => {
            setSelectedRowNames([]);
            setDeleteTarget(null);
            setDeleteDialogOpen(false);
            return catchError(err);
          }
        }
      );
    });
  };

  useEffect(() => {
    if (dispatch) {
      const hasActiveProject = data?.some((project) => project.isActive) ?? false;
      dispatch({ type: 'SET_ACTIVE_PROJECT', payload: hasActiveProject });
    }
  }, [dispatch, data]);

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL
      || typeof WebSocket === 'undefined'
    ) {
      return undefined;
    }

    const url = new URL('/api/realtime', process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('resource', 'project');
    url.searchParams.set('shareId', 'projects');
    url.searchParams.set('clientId', realtimeClientId);

    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket | undefined;
    let closedByComponent = false;

    const connect = () => {
      socket = new WebSocket(url.toString());
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as RealtimePayload;
          if (payload.type === 'connected' || payload.originClientId === realtimeClientId) {
            return;
          }
          if (payload.action === 'created' || payload.action === 'updated' || payload.action === 'deleted') {
            router.refresh();
          }
        } catch {
          // Ignore malformed realtime messages instead of disturbing the projects table.
        }
      };
      socket.onclose = () => {
        if (!closedByComponent) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      closedByComponent = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      closeRealtimeSocket(socket);
    };
  }, [realtimeClientId, router]);

  useEffect(() => {
    const refreshVisibleProjects = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };
    window.addEventListener('focus', refreshVisibleProjects);

    return () => {
      window.removeEventListener('focus', refreshVisibleProjects);
    };
  }, [router]);

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
                <Link href={`/projects?edit=${encodeURIComponent(row.original.name)}`}>{t('table.edit')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  row.toggleSelected(false);
                  requestDelete({ type: 'single', name: row.original.name });
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
    if (selectedRowNames.length) {
      requestDelete({ type: 'selected' });
    }
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={data as ProjectTypes.ProjectType[]}
        pageCount={pageCount as number}
        filterableColumns={[]}
        newRowLink="/projects?modal=new"
        deleteRowsAction={deleteSelectedRows}
      />
      <ConfirmActionDialog
        open={deleteDialogOpen}
        pending={isPending}
        description={t(deleteTarget?.type === 'selected'
          ? 'confirm.deleteProjectsDescription'
          : 'confirm.deleteProjectDescription')}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default ProjectsTableShell;
