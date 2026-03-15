'use client';

import React, {
  useEffect, useState, useCallback, useMemo, useRef
} from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { DashboardTypes, VisualizationTypes } from '@illustry/types';
import { useRouter } from 'next/navigation';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { updateDashboard } from '@/app/_actions/dashboard';
import HubShell from './hub-shell';

const ResponsiveGridLayout = WidthProvider(Responsive) as unknown as React.FC<Record<string, unknown>>;

type VisualizationData = {
  dashboard: DashboardTypes.DashboardType | null;
};
type ResponsiveLayouts = Record<string, DashboardTypes.Layout[]>;

const ResizableDashboard = ({ dashboard }: VisualizationData) => {
  const router = useRouter();
  const { layouts = [], visualizations = [] } = dashboard as DashboardTypes.DashboardType;
  const initialLayout = useMemo(() => (layouts?.length ? layouts
    : (visualizations as VisualizationTypes.VisualizationType[])
      .map((viz, index) => ({
        i: index.toString(),
        x: 4 * (index % 3),
        y: Math.floor(index / 3) * 2,
        w: 10,
        h: 4,
        minW: 4,
        minH: 2
      })) as DashboardTypes.Layout[]), [layouts, visualizations]);

  const [layout, setLayout] = useState<DashboardTypes.Layout[]>(initialLayout);
  const [activeBreakpoint, setActiveBreakpoint] = useState('lg');
  const [hasLayoutChanged, setHasLayoutChanged] = useState(false);
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
    const updatedDash = {
      ...currentDashboard,
      layouts: responsiveLayoutsRef.current.lg
    };
    delete updatedDash.visualizations;
    await updateDashboard(updatedDash);
    setHasLayoutChanged(false);
    hasLayoutChangedRef.current = false;
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      void updateDashboardLayout();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      void updateDashboardLayout();
    };
  }, [updateDashboardLayout]);

  const handleUserLayoutCommit = useCallback((newLayout: DashboardTypes.Layout[]) => {
    if (activeBreakpoint !== 'lg') {
      return;
    }
    const cloned = cloneLayout(newLayout);
    responsiveLayoutsRef.current = {
      ...responsiveLayoutsRef.current,
      lg: cloned
    };
    hasLayoutChangedRef.current = true;
    setLayout(cloned);
    setResponsiveLayouts((prev) => ({
      ...prev,
      lg: cloned
    }));
    setHasLayoutChanged(true);
    void updateDashboardLayout();
  }, [activeBreakpoint, cloneLayout, updateDashboardLayout]);

  const handleCardClick = (viz: VisualizationTypes.VisualizationType) => {
    const url = `/visualizationhub?name=${viz.name}&type=${viz.type}`;
    router.push(url);
  };

  return (
    <div className="p-4">
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
        {(visualizations as VisualizationTypes.VisualizationType[]).map((viz, i) => (
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
                    {viz.name} ({(viz.type as string).charAt(0).toUpperCase() + viz.type.slice(1)} Chart)
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
