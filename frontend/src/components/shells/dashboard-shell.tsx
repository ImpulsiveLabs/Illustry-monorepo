'use client';

import React, {
  useEffect, useState, useCallback, useMemo, useRef
} from 'react';
import { DashboardTypes, VisualizationTypes } from '@illustry/types';
import { useRouter } from 'next/navigation';
import { Download, GripHorizontal, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { updateDashboard } from '@/app/_actions/dashboard';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/providers/locale-provider';
import {
  downloadExportFromApi,
  getServerDashboardExportPayload,
  getServerDashboardPreviewDataUrl
} from '@/lib/chart-export';
import { getRealtimeClientId, type RealtimePayload } from '@/lib/realtime-client';
import ExportDownloadDialog, { type ExportDownloadValues } from '@/components/export/export-download-dialog';
import HubShell from './hub-shell';

type VisualizationData = {
  dashboard: DashboardTypes.DashboardType | null;
};
type DashboardBreakpoint = 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

const dashboardCols: Record<DashboardBreakpoint, number> = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2
};

const dashboardTileWidths: Record<DashboardBreakpoint, number> = {
  lg: 4,
  md: 5,
  sm: 6,
  xs: 4,
  xxs: 2
};

const DASHBOARD_TILE_HEIGHT = 4;
const DASHBOARD_TILE_MIN_WIDTH = 2;
const DASHBOARD_TILE_MIN_HEIGHT = 2;
const DASHBOARD_MAX_VISIBLE_VISUALIZATIONS = 6;

const createDefaultFixedLayoutItem = (
  index: number,
  breakpoint: DashboardBreakpoint
): DashboardTypes.Layout => {
  const cols = dashboardCols[breakpoint];
  const width = dashboardTileWidths[breakpoint];
  const tilesPerRow = Math.max(1, Math.floor(cols / width));

  return {
    i: index.toString(),
    x: (index % tilesPerRow) * width,
    y: Math.floor(index / tilesPerRow) * DASHBOARD_TILE_HEIGHT,
    w: width,
    h: DASHBOARD_TILE_HEIGHT,
    minW: DASHBOARD_TILE_MIN_WIDTH,
    minH: DASHBOARD_TILE_MIN_HEIGHT
  };
};

const getSlotMetrics = (breakpoint: DashboardBreakpoint) => {
  const width = dashboardTileWidths[breakpoint];
  const cols = dashboardCols[breakpoint];
  return {
    width,
    tilesPerRow: Math.max(1, Math.floor(cols / width))
  };
};

const getLayoutSlot = (
  layout: DashboardTypes.Layout | undefined,
  index: number,
  breakpoint: DashboardBreakpoint
) => {
  const fallback = createDefaultFixedLayoutItem(index, breakpoint);
  const { width, tilesPerRow } = getSlotMetrics(breakpoint);
  const rawX = layout?.x ?? fallback.x;
  const rawY = layout?.y ?? fallback.y;
  const column = Math.max(0, Math.min(tilesPerRow - 1, Math.round(rawX / width)));
  const row = Math.max(0, Math.round(rawY / DASHBOARD_TILE_HEIGHT));

  return row * tilesPerRow + column;
};

const createLayoutItemForSlot = (
  index: number,
  slot: number,
  breakpoint: DashboardBreakpoint
): DashboardTypes.Layout => {
  const { width, tilesPerRow } = getSlotMetrics(breakpoint);

  return {
    i: index.toString(),
    x: (slot % tilesPerRow) * width,
    y: Math.floor(slot / tilesPerRow) * DASHBOARD_TILE_HEIGHT,
    w: width,
    h: DASHBOARD_TILE_HEIGHT,
    minW: DASHBOARD_TILE_MIN_WIDTH,
    minH: DASHBOARD_TILE_MIN_HEIGHT
  };
};

const createFixedLayout = (
  layouts: DashboardTypes.Layout[],
  visualizations: VisualizationTypes.VisualizationType[],
  breakpoint: DashboardBreakpoint
) => {
  const layoutsById = new Map(layouts.map((layout) => [layout.i, layout]));
  const usedSlots = new Set<number>();

  return visualizations.map((_, index) => {
    const preferredSlot = getLayoutSlot(layoutsById.get(index.toString()), index, breakpoint);
    const slot = Array.from(
      { length: DASHBOARD_MAX_VISIBLE_VISUALIZATIONS },
      (__, slotIndex) => slotIndex
    )
      .sort((a, b) => Math.abs(a - preferredSlot) - Math.abs(b - preferredSlot))
      .find((slotIndex) => !usedSlots.has(slotIndex)) ?? index;

    usedSlots.add(slot);
    return createLayoutItemForSlot(index, slot, breakpoint);
  });
};

const normalizeLayoutForBreakpoint = (
  layouts: DashboardTypes.Layout[],
  visualizations: VisualizationTypes.VisualizationType[],
  breakpoint: string
): DashboardTypes.Layout[] => createFixedLayout(
  layouts,
  visualizations,
  (breakpoint in dashboardCols ? breakpoint : 'lg') as DashboardBreakpoint
);

const ResizableDashboard = ({ dashboard }: VisualizationData) => {
  const { t } = useLocale();
  const router = useRouter();
  const {
    layouts = [],
    visualizations = []
  } = (dashboard ?? {}) as Partial<DashboardTypes.DashboardType>;
  const canEditDashboard = !dashboard?.isExternal;
  const visualizationsList = visualizations as VisualizationTypes.VisualizationType[];
  const visibleVisualizations = useMemo(
    () => visualizationsList.slice(0, DASHBOARD_MAX_VISIBLE_VISUALIZATIONS),
    [visualizationsList]
  );
  const fixedLayout = useMemo(
    () => normalizeLayoutForBreakpoint(layouts, visibleVisualizations, 'lg'),
    [layouts, visibleVisualizations]
  );
  const [currentLayout, setCurrentLayout] = useState<DashboardTypes.Layout[]>(fixedLayout);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fixedDashboardItems = useMemo(() => visibleVisualizations
    .map((viz, index) => ({
      viz,
      index,
      slot: currentLayout[index] ? currentLayout[index].y * 100 + currentLayout[index].x : index
    }))
    .sort((a, b) => a.slot - b.slot || a.index - b.index), [currentLayout, visibleVisualizations]);

  const [layoutPending, setLayoutPending] = useState(false);
  const [exportPending, setExportPending] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [currentShareId, setCurrentShareId] = useState(dashboard?.shareId);
  const realtimeClientId = useMemo(() => getRealtimeClientId(), []);
  const dashboardRef = useRef(dashboard);
  const dashboardExportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dashboardRef.current = dashboard;
    setCurrentShareId(dashboard?.shareId);
  }, [dashboard]);

  useEffect(() => {
    setCurrentLayout(fixedLayout);
  }, [fixedLayout]);

  const swapDashboardSlots = useCallback((sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) {
      return;
    }

    setCurrentLayout((previousLayout) => {
      const nextLayout = normalizeLayoutForBreakpoint(
        previousLayout,
        visibleVisualizations,
        'lg'
      ).map((item) => ({ ...item }));
      const source = nextLayout[sourceIndex];
      const target = nextLayout[targetIndex];

      if (!source || !target) {
        return previousLayout;
      }

      const sourcePosition = { x: source.x, y: source.y };
      source.x = target.x;
      source.y = target.y;
      target.x = sourcePosition.x;
      target.y = sourcePosition.y;

      return nextLayout;
    });
  }, [visibleVisualizations]);

  const handleDragStart = useCallback((
    event: React.DragEvent<HTMLElement>,
    sourceIndex: number
  ) => {
    if (!canEditDashboard) {
      event.preventDefault();
      return;
    }
    setDraggedIndex(sourceIndex);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', sourceIndex.toString());
  }, [canEditDashboard]);

  const handleDragOver = useCallback((
    event: React.DragEvent<HTMLElement>,
    targetIndex: number
  ) => {
    if (!canEditDashboard) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverIndex(targetIndex);
  }, [canEditDashboard]);

  const handleDrop = useCallback((
    event: React.DragEvent<HTMLElement>,
    targetIndex: number
  ) => {
    if (!canEditDashboard) {
      return;
    }
    event.preventDefault();
    const rawSourceIndex = event.dataTransfer.getData('text/plain');
    const sourceIndex = Number(rawSourceIndex);

    if (Number.isInteger(sourceIndex)) {
      swapDashboardSlots(sourceIndex, targetIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [canEditDashboard, swapDashboardSlots]);

  const clearDragState = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const updateDashboardLayout = useCallback(async () => {
    const currentDashboard = dashboardRef.current;
    if (!canEditDashboard || !currentDashboard || !visibleVisualizations.length) {
      return;
    }
    setLayoutPending(true);
    const updatedDash: DashboardTypes.DashboardUpdate = {
      name: currentDashboard.name,
      shareId: currentDashboard.shareId,
      realtimeClientId,
      layouts: normalizeLayoutForBreakpoint(currentLayout, visibleVisualizations, 'lg')
        .map((item) => ({ ...item }))
    } as DashboardTypes.DashboardUpdate & { realtimeClientId: string };
    try {
      const result = await updateDashboard(updatedDash);
      if (result) {
        toast.success(t('dashboard.layoutSaved'));
      } else {
        toast.error(t('dashboard.layoutSaveError'));
      }
    } catch {
      toast.error(t('dashboard.layoutSaveError'));
    } finally {
      setLayoutPending(false);
    }
  }, [canEditDashboard, currentLayout, realtimeClientId, t, visibleVisualizations]);

  useEffect(() => {
    if (
      !currentShareId
      || !process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL
      || typeof WebSocket === 'undefined'
    ) {
      return undefined;
    }

    const url = new URL('/api/realtime', process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('resource', 'dashboard');
    url.searchParams.set('shareId', currentShareId);
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
          if (payload.action === 'deleted') {
            toast.error('This dashboard was deleted by its owner.');
            closedByComponent = true;
            socket?.close();
            router.replace('/');
            return;
          }
          if (payload.action === 'updated' || payload.action === 'shared' || payload.action === 'theme-updated') {
            router.refresh();
          }
        } catch {
          // Ignore malformed realtime messages instead of disturbing the current session.
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
      try {
        socket?.close();
      } catch {
        // The browser may already have torn the socket down during navigation.
      }
    };
  }, [currentShareId, realtimeClientId, router]);

  useEffect(() => {
    if (
      !canEditDashboard
      || currentShareId
      || !process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL
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
          if (payload.action === 'updated') {
            router.refresh();
          }
        } catch {
          // Ignore malformed realtime messages instead of disturbing the current dashboard.
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
      socket?.close();
    };
  }, [canEditDashboard, currentShareId, realtimeClientId, router]);

  const handleCardClick = (viz: VisualizationTypes.VisualizationType) => {
    if (dashboard?.isExternal) {
      if (viz.accessType === 'inherited' && viz.sourceDashboardId) {
        router.push(
          `/visualizationhub?dashboardShare=${encodeURIComponent(viz.sourceDashboardId)}&name=${encodeURIComponent(viz.name)}&type=${encodeURIComponent(String(viz.type))}`
        );
        return;
      }
      if (viz.shareId) {
        router.push(`/visualizationhub?share=${encodeURIComponent(viz.shareId)}`);
        return;
      }
      toast.error('This visualization is only available inside the shared dashboard.');
      return;
    }

    const url = `/visualizationhub?name=${encodeURIComponent(viz.name)}&type=${encodeURIComponent(String(viz.type))}`;
    router.push(url);
  };

  const handleDashboardExport = async (values: ExportDownloadValues) => {
    const element = dashboardExportRef.current;
    if (!element) {
      toast.error('The dashboard is not ready to export yet.');
      return;
    }
    if (!dashboard?.name && !dashboard?.shareId) {
      toast.error('The dashboard is not ready to export yet.');
      return;
    }

    const wantsDocumentPreview = values.formats.some((format) => (
      format === 'excel' || format === 'pdf' || format === 'word' || format === 'ppt'
    ));
    const charts = getServerDashboardExportPayload(element, {
      includePreview: false
    });
    if (!charts.length) {
      toast.error('No dashboard visualizations are ready to export yet.');
      return;
    }

    setExportPending(true);
    try {
      const result = await downloadExportFromApi({
        endpoint: '/api/export/dashboard',
        fallbackFilename: 'illustry-dashboard-export',
        payload: {
          name: dashboard?.isExternal ? undefined : dashboard?.name,
          shareId: dashboard?.isExternal ? dashboard?.shareId : undefined,
          title: `dashboard-${dashboard?.name || 'export'}`,
          charts,
          previewDataUrl: wantsDocumentPreview ? getServerDashboardPreviewDataUrl(element) : undefined,
          ...values
        }
      });
      toast.success(result.bundled ? 'Dashboard ZIP export started' : 'Dashboard export started');
      setExportDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to export this dashboard.');
    } finally {
      setExportPending(false);
    }
  };

  const getTypeLabel = useCallback(
    (type: VisualizationTypes.VisualizationTypesEnum | VisualizationTypes.VisualizationTypesEnum[]) => {
      const normalizedType = Array.isArray(type) ? type[0] : type;
      switch (normalizedType) {
      case VisualizationTypes.VisualizationTypesEnum.LINE_CHART:
        return t('viz.lineChart');
      case VisualizationTypes.VisualizationTypesEnum.BAR_CHART:
        return t('viz.barChart');
      case VisualizationTypes.VisualizationTypesEnum.PIE_CHART:
        return t('viz.pieChart');
      case VisualizationTypes.VisualizationTypesEnum.CALENDAR:
        return t('viz.calendar');
      case VisualizationTypes.VisualizationTypesEnum.SCATTER:
        return t('viz.scatter');
      case VisualizationTypes.VisualizationTypesEnum.TREEMAP:
        return t('viz.treemap');
      case VisualizationTypes.VisualizationTypesEnum.SUNBURST:
        return t('viz.sunburst');
      case VisualizationTypes.VisualizationTypesEnum.FUNNEL:
        return t('viz.funnel');
      case VisualizationTypes.VisualizationTypesEnum.TIMELINE:
        return t('viz.timeline');
      case VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD:
        return t('viz.wordCloud');
      case VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH:
        return t('viz.forcedLayoutGraph');
      case VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING:
        return t('viz.hierarchicalEdgeBundling');
      case VisualizationTypes.VisualizationTypesEnum.SANKEY:
        return t('viz.sankey');
      case VisualizationTypes.VisualizationTypesEnum.MATRIX:
        return t('viz.matrix');
      default:
        return Array.isArray(type) ? type.join(', ') : type;
      }
    },
    [t]
  );

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col overflow-hidden p-3">
      <ExportDownloadDialog
        open={exportDialogOpen}
        pending={exportPending}
        title="Export dashboard"
        description="Choose one or more formats. The backend prepares one file directly or packages multiple exports into a ZIP."
        defaultSheetName="Dashboard"
        onOpenChange={setExportDialogOpen}
        onSubmit={(values) => void handleDashboardExport(values)}
      />
      <div className="mb-3 flex shrink-0 justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          className="shadow-sm"
          disabled={!visualizationsList.length || exportPending}
          aria-label="Export dashboard"
          onClick={() => setExportDialogOpen(true)}
        >
          <Download className="mr-2 h-4 w-4" />
          {exportPending ? 'Exporting' : 'Export'}
        </Button>
        {canEditDashboard ? (
          <Button
            type="button"
            className="shadow-sm"
            onClick={() => void updateDashboardLayout()}
            disabled={!visibleVisualizations.length || layoutPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {layoutPending ? 'Saving' : 'Save layout'}
          </Button>
        ) : null}
      </div>
      <div
        ref={dashboardExportRef}
        className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-3 overflow-hidden max-lg:grid-cols-2 max-lg:grid-rows-3 max-sm:grid-cols-1 max-sm:grid-rows-6"
        data-testid="dashboard-fixed-grid"
      >
        {fixedDashboardItems.map(({ viz, index }) => (
          <div
            key={`${viz.name}-${index}`}
            data-dashboard-visualization-title={`${viz.name} (${getTypeLabel(viz.type)})`}
            className={[
              'min-h-0 overflow-hidden rounded-lg border bg-card shadow-sm',
              dragOverIndex === index && draggedIndex !== index
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-gray-200',
              draggedIndex === index ? 'opacity-70' : ''
            ].filter(Boolean).join(' ')}
            onDragOver={canEditDashboard ? (event) => handleDragOver(event, index) : undefined}
            onDrop={canEditDashboard ? (event) => handleDrop(event, index) : undefined}
            onDragLeave={canEditDashboard ? () => setDragOverIndex((current) => (current === index ? null : current)) : undefined}
            data-testid={`dashboard-card-${index}`}
          >
            <Card className="h-full min-h-0 border-0 shadow-none">
              <div className="relative flex h-full min-h-0 flex-col">
                <CardHeader
                  className={`flex h-10 shrink-0 items-center justify-center gap-2 px-3 py-2 ${
                    canEditDashboard ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  }`}
                  onClick={() => handleCardClick(viz)}
                  draggable={canEditDashboard}
                  onDragStart={(event) => handleDragStart(event, index)}
                  onDragEnd={clearDragState}
                  aria-label={canEditDashboard ? `Move ${viz.name}` : `Open ${viz.name}`}
                >
                  {canEditDashboard ? (
                    <GripHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : null}
                  <CardTitle className="line-clamp-1 text-center text-sm leading-tight">
                    {viz.name} ({getTypeLabel(viz.type)})
                  </CardTitle>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 overflow-hidden p-2">
                  <HubShell
                    data={viz}
                    fullScreen={false}
                    filter={false}
                    legend={true}
                    useDataTheme={Boolean(dashboard?.isExternal)}
                  />
                </CardContent>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResizableDashboard;
