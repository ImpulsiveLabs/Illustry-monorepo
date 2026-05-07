'use client';

import React, {
  useEffect, useState, useCallback, useMemo, useRef
} from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { DashboardTypes, VisualizationTypes } from '@illustry/types';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { updateDashboard } from '@/app/_actions/dashboard';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/providers/locale-provider';
import HubShell from './hub-shell';

const ResponsiveGridLayout = WidthProvider(Responsive) as unknown as React.FC<Record<string, unknown>>;

type VisualizationData = {
  dashboard: DashboardTypes.DashboardType | null;
};
type ResponsiveLayouts = Record<string, DashboardTypes.Layout[]>;

const createInitialLayout = (
  layouts: DashboardTypes.Layout[],
  visualizations: VisualizationTypes.VisualizationType[]
) => (layouts.length ? layouts
  : Array.from({ length: visualizations.length }, (_, index) => ({
    i: index.toString(),
    x: 4 * (index % 3),
    y: Math.floor(index / 3) * 4,
    w: 4,
    h: 4,
    minW: 3,
    minH: 2
  })) as DashboardTypes.Layout[]);

const ResizableDashboard = ({ dashboard }: VisualizationData) => {
  const { t } = useLocale();
  const router = useRouter();
  const { layouts = [], visualizations = [] } = dashboard as DashboardTypes.DashboardType;
  const visualizationsList = visualizations as VisualizationTypes.VisualizationType[];
  const initialLayoutSignature = JSON.stringify({
    layouts,
    visualizations: visualizationsList.map((viz) => ({
      name: viz.name,
      type: viz.type
    }))
  });
  const initialLayout = useMemo(
    () => createInitialLayout(layouts, visualizationsList),
    [initialLayoutSignature]
  );

  const [, setLayout] = useState<DashboardTypes.Layout[]>(initialLayout);
  const [activeBreakpoint, setActiveBreakpoint] = useState('lg');
  const [hasLayoutChanged, setHasLayoutChanged] = useState(false);
  const [layoutPending, setLayoutPending] = useState(false);
  const [currentShareId, setCurrentShareId] = useState(dashboard?.shareId);
  const hasLayoutChangedRef = useRef(false);
  const dashboardRef = useRef(dashboard);
  const responsiveLayoutsRef = useRef<ResponsiveLayouts>({});
  const cloneLayout = useCallback(
    (items: DashboardTypes.Layout[]) => items.map((item) => ({ ...item })),
    []
  );
  const [responsiveLayouts, setResponsiveLayouts] = useState<ResponsiveLayouts>(() => ({
    lg: cloneLayout(initialLayout)
  }));

  useEffect(() => {
    setLayout(initialLayout);
    setResponsiveLayouts((prev) => ({
      ...prev,
      lg: cloneLayout(initialLayout)
    }));
    setHasLayoutChanged(false);
  }, [cloneLayout, initialLayout]);

  useEffect(() => {
    hasLayoutChangedRef.current = hasLayoutChanged;
  }, [hasLayoutChanged]);

  useEffect(() => {
    dashboardRef.current = dashboard;
    setCurrentShareId(dashboard?.shareId);
  }, [dashboard]);

  useEffect(() => {
    responsiveLayoutsRef.current = responsiveLayouts;
  }, [responsiveLayouts]);

  const onLayoutChange = useCallback(
    (newLayout: DashboardTypes.Layout[], allLayouts: ResponsiveLayouts) => {
      setResponsiveLayouts((prev) => {
        const nextLayouts: ResponsiveLayouts = { ...prev };
        Object.entries(allLayouts || {}).forEach(([breakpoint, bpLayout]) => {
          nextLayouts[breakpoint] = cloneLayout(bpLayout);
        });
        return nextLayouts;
      });

      if (activeBreakpoint === 'lg') {
        setLayout(cloneLayout(newLayout));
      }
    },
    [activeBreakpoint, cloneLayout]
  );

  const onBreakpointChange = useCallback((newBreakpoint: string) => {
    setActiveBreakpoint(newBreakpoint);
  }, []);

  const updateDashboardLayout = useCallback(async () => {
    const currentDashboard = dashboardRef.current;
    if (!currentDashboard || !hasLayoutChangedRef.current) {
      return;
    }
    setLayoutPending(true);
    const updatedDash = {
      ...currentDashboard,
      layouts: responsiveLayoutsRef.current.lg
        || responsiveLayoutsRef.current[activeBreakpoint]
        || []
    };
    delete updatedDash.visualizations;
    const result = await updateDashboard(updatedDash);
    if (result) {
      toast.success('Dashboard layout saved');
      setHasLayoutChanged(false);
      hasLayoutChangedRef.current = false;
    } else {
      toast.error('Unable to save dashboard layout');
    }
    setLayoutPending(false);
  }, [activeBreakpoint]);

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

    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket | undefined;
    let closedByComponent = false;

    const connect = () => {
      socket = new WebSocket(url.toString());
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type?: string; action?: string };
          if (payload.type !== 'connected') {
            if (payload.action === 'deleted') {
              router.replace('/dashboards?scope=external');
              router.refresh();
              return;
            }
            router.refresh();
          }
        } catch {
          router.refresh();
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
  }, [currentShareId, router]);

  const handleUserLayoutCommit = useCallback((newLayout: DashboardTypes.Layout[]) => {
    const cloned = cloneLayout(newLayout);
    responsiveLayoutsRef.current = {
      ...responsiveLayoutsRef.current,
      [activeBreakpoint]: cloned,
      lg: activeBreakpoint === 'lg' ? cloned : (responsiveLayoutsRef.current.lg || cloned)
    };
    hasLayoutChangedRef.current = true;
    setLayout(cloned);
    setResponsiveLayouts((prev) => ({
      ...prev,
      lg: cloned
    }));
    setHasLayoutChanged(true);
  }, [activeBreakpoint, cloneLayout]);

  const handleCardClick = (viz: VisualizationTypes.VisualizationType) => {
    const url = `/visualizationhub?name=${viz.name}&type=${viz.type}`;
    router.push(url);
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
    <div className="p-4">
      <div className="sticky top-20 z-20 mb-4 flex justify-end">
        <Button
          type="button"
          className="shadow-sm"
          onClick={() => void updateDashboardLayout()}
          disabled={!hasLayoutChanged || layoutPending}
        >
          <Save className="mr-2 h-4 w-4" />
          {layoutPending ? 'Saving' : 'Save layout'}
        </Button>
      </div>
      <ResponsiveGridLayout
        className="layout"
        layouts={responsiveLayouts}
        breakpoints={{
          lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0
        }}
        cols={{
          lg: 12, md: 10, sm: 6, xs: 4, xxs: 2
        }}
        rowHeight={150}
        onLayoutChange={onLayoutChange}
        onBreakpointChange={onBreakpointChange}
        onDragStop={handleUserLayoutCommit}
        onResizeStop={handleUserLayoutCommit}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".draggable-corner"
      >
        {visualizationsList.map((viz, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg shadow-sm overflow-hidden"
          >
            <Card className="h-full">
              <div className="relative h-full">
                {/* Draggable corners */}
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((position) => (
                  <div
                    key={position}
                    className={`draggable-corner absolute ${position} w-[10%] h-[10%] cursor-move bg-transparent`}
                  ></div>
                ))}
                <CardHeader
                  className="cursor-pointer flex justify-center items-center h-[4rem]"
                  onClick={() => handleCardClick(viz)}
                >
                  <CardTitle className="text-center">
                    {viz.name} ({getTypeLabel(viz.type)})
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-4rem)] overflow-hidden">
                  <HubShell data={viz} fullScreen={false} filter={false} legend={true} />
                </CardContent>
              </div>
            </Card>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default ResizableDashboard;
