'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { toast } from 'sonner';
import { DashboardTypes } from '@illustry/types';
import {
  useEffect, useMemo, useState, useTransition
} from 'react';
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
import ExternalInternalToggle from '../data-table/external-internal-toggle';
import ConfirmActionDialog from '@/components/ui/confirm-action-dialog';
import { closeRealtimeSocket, getRealtimeClientId, type RealtimePayload } from '@/lib/realtime-client';

type DashboardsTableShellProps = {
  data?: DashboardTypes.DashboardType[];
  pageCount?: number;
  external?: boolean;
}

const DashboardsTableShell = ({ data, pageCount, external = false }: DashboardsTableShellProps) => {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [selectedRowNames, setSelectedRowNames] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'single' | 'selected';
    value?: string | DashboardTypes.DashboardFilter;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const realtimeClientId = useMemo(() => getRealtimeClientId(), []);

  const requestDelete = (target: {
    type: 'single' | 'selected';
    value?: string | DashboardTypes.DashboardFilter;
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
        ? deleteDashboard(target.value)
        : Promise.all(selectedRowNames.map((name) => deleteDashboard(name)));

      toast.promise(Promise.resolve(promise), {
        loading: t('table.deleting'),
        success: () => {
          setSelectedRowNames([]);
          setDeleteTarget(null);
          setDeleteDialogOpen(false);
          router.refresh();
          return target.type === 'single' ? t('toast.dashboardDeleted') : t('toast.dashboardsDeleted');
        },
        error: (err: unknown) => {
          setSelectedRowNames([]);
          setDeleteTarget(null);
          setDeleteDialogOpen(false);
          return catchError(err);
        }
      });
    });
  };

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL
      || typeof WebSocket === 'undefined'
    ) {
      return undefined;
    }

    const url = new URL('/api/realtime', process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('resource', 'user');
    url.searchParams.set('shareId', 'me');
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
          if (
            payload.action === 'created'
            || payload.action === 'updated'
            || payload.action === 'deleted'
            || payload.action === 'shared'
          ) {
            router.refresh();
          }
        } catch {
          // Ignore malformed realtime messages instead of disturbing the dashboards table.
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
    const refreshVisibleDashboards = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };
    window.addEventListener('focus', refreshVisibleDashboards);

    return () => {
      window.removeEventListener('focus', refreshVisibleDashboards);
    };
  }, [router]);

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
      ...(external ? [
        {
          accessorKey: 'ownerEmail',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('table.owner')} />
          )
        } as ColumnDef<DashboardTypes.DashboardType, unknown>,
        {
          accessorKey: 'currentUserRole',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('table.myRole')} />
          )
        } as ColumnDef<DashboardTypes.DashboardType, unknown>
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
	                      ? `/dashboardhub?share=${row.original.shareId}`
	                      : `/dashboardhub?name=${row.original.name}`}
	                >
                  {t('table.view')}
                </Link>
              </DropdownMenuItem>
	              {!external && (
	                <>
	                  <DropdownMenuSeparator />
	                  <DropdownMenuItem asChild>
	                    <Link href={`/dashboards?edit=${encodeURIComponent(row.original.name)}`}>{t('table.edit')}</Link>
	                  </DropdownMenuItem>
	                  <DropdownMenuSeparator />
		                  <DropdownMenuItem asChild>
		                    <Link href={`/share/dashboard?name=${encodeURIComponent(row.original.name)}`}>
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
                    value: row.original.isExternal && row.original.shareId
                      ? { shareId: row.original.shareId }
                      : row.original.name
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
    if (selectedRowNames.length) {
      requestDelete({ type: 'selected' });
    }
  };

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={data as DashboardTypes.DashboardType[]}
        pageCount={pageCount as number}
        filterableColumns={[]}
        newRowLink={external ? undefined : '/dashboards?modal=new'}
        deleteRowsAction={external ? undefined : deleteSelectedRows}
        toolbarActions={<ExternalInternalToggle mode={external ? 'external' : 'owned'} />}
      />
      <ConfirmActionDialog
        open={deleteDialogOpen}
        pending={isPending}
        description={t(deleteTarget?.type === 'selected'
          ? 'confirm.deleteDashboardsDescription'
          : 'confirm.deleteDashboardDescription')}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default DashboardsTableShell;
