'use client';

import React, {
  forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState
} from 'react';
import ReactECharts from 'echarts-for-react';
import 'echarts-wordcloud';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import * as echarts from 'echarts/core';
import {
  SankeyChart,
  GraphChart,
  HeatmapChart,
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
  TreemapChart,
  SunburstChart,
  FunnelChart
} from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  VisualMapComponent,
  CalendarComponent,
  ToolboxComponent
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import {
  downloadExportFromApi,
  getServerChartExportPayload,
  type ServerChartExportFormat
} from '@/lib/chart-export';
import ExportDownloadDialog, {
  exportOptions,
  type ExportDownloadValues
} from '@/components/export/export-download-dialog';
import ViewTooltip from '@/components/views/shared/view-tooltip';

// Initialize ECharts modules
echarts.use([
  GraphChart,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  SVGRenderer,
  TransformComponent,
  SankeyChart,
  LegendComponent,
  HeatmapChart,
  VisualMapComponent,
  CalendarComponent,
  LineChart,
  PieChart,
  BarChart,
  ToolboxComponent,
  ScatterChart,
  TreemapChart,
  SunburstChart,
  FunnelChart
]);

type ReactEChartsProps<T> = {
  option: T;
  className?: string;
  settings?: any;
  loading?: boolean;
  theme?: 'light' | 'dark';
  style?: React.CSSProperties;
  onEvents?: Record<string, (...args: any[]) => void>;
  helperText?: string;
};

const getVisualizationExportFilename = () => {
  if (window.location.pathname.includes('/playground')) {
    return 'playground-visualization';
  }

  const params = new URLSearchParams(window.location.search);
  return `visualization-${params.get('name') || 'export'}`;
};

const withZoomSupport = <T,>(option: T): T => {
  if (!option || typeof option !== 'object') {
    return option;
  }

  const source = option as Record<string, any>;
  const series = Array.isArray(source.series)
    ? source.series.map((item: Record<string, any>) => {
      if (!item || typeof item !== 'object') {
        return item;
      }

      if (['graph', 'tree', 'treemap'].includes(String(item.type))) {
        return { ...item, roam: item.roam ?? true };
      }

      return item;
    })
    : source.series;

  return {
    ...source,
    series,
    toolbox: {
      ...source.toolbox,
      feature: {
        ...(source.toolbox?.feature ?? {}),
        restore: source.toolbox?.feature?.restore ?? {}
      }
    }
  } as T;
};

// Updated ReactEcharts Component with forwardRef
const ReactEcharts = forwardRef(<T,>(
  {
    option, className, loading, theme, style, onEvents, helperText
  }: ReactEChartsProps<T>,
  ref: React.Ref<unknown> | undefined
) => {
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [exportPending, setExportPending] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const { t } = useLocale();
  const tooltipText = helperText || t('tooltip.generic');
  const zoomableOption = useMemo(() => withZoomSupport(option), [option]);
  const canExport = useMemo(() => (
    typeof window !== 'undefined'
    && (
      window.location.pathname.includes('/visualizationhub')
      || window.location.pathname.includes('/playground')
    )
  ), []);
  const canExcelExport = useMemo(() => (
    typeof window !== 'undefined'
    && window.location.pathname.includes('/visualizationhub')
  ), []);
  const availableExportOptions = useMemo(
    () => exportOptions.filter((option) => option.value !== 'excel' || canExcelExport),
    [canExcelExport]
  );

  useImperativeHandle(ref, () => ({
    getEchartsInstance: () => chartRef.current?.getEchartsInstance()
  }));

  useEffect(() => {
    const resizeChart = () => {
      chartRef.current?.getEchartsInstance()?.resize();
    };

    window.addEventListener('resize', resizeChart);
    const resizeObserver = new ResizeObserver(() => {
      resizeChart();
    });
    resizeObserver.observe(containerRef.current as HTMLDivElement);

    return () => {
      window.removeEventListener('resize', resizeChart);
      resizeObserver.disconnect();
    };
  }, []);

  const handleExport = async (values: ExportDownloadValues) => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) {
      toast.error('The visualization is not ready to export yet.');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const name = params.get('name') || undefined;
    const type = params.get('type') || undefined;
    const shareId = params.get('share') || undefined;
    const dashboardShareId = params.get('dashboardShare') || undefined;
    const wantsExcel = values.formats.includes('excel' as ServerChartExportFormat);
    const wantsDocumentPreview = values.formats.some((format) => (
      format === 'excel' || format === 'pdf' || format === 'word' || format === 'ppt'
    ));

    if (wantsExcel && !shareId && !dashboardShareId && (!name || !type)) {
      toast.error('Open a saved visualization before exporting it to Excel.');
      return;
    }

    setExportPending(true);
    try {
      const result = await downloadExportFromApi({
        endpoint: '/api/export/visualization',
        fallbackFilename: wantsExcel ? 'illustry-visualization.xlsx' : 'illustry-visualization-export',
        payload: {
          name,
          type,
          shareId,
          dashboardShareId,
          title: getVisualizationExportFilename(),
          charts: [getServerChartExportPayload(chart, getVisualizationExportFilename(), {
            includePreview: wantsDocumentPreview
          })],
          ...values
        }
      });
      toast.success(result.bundled ? 'Export ZIP started' : 'Export started');
      setExportDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to export this visualization.');
    } finally {
      setExportPending(false);
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <ExportDownloadDialog
        open={exportDialogOpen}
        pending={exportPending}
        title="Export visualization"
        description="Choose one or more formats. A single selection downloads directly; multiple selections are prepared as a backend ZIP."
        defaultSheetName="Visualization"
        options={availableExportOptions}
        onOpenChange={setExportDialogOpen}
        onSubmit={(values) => void handleExport(values)}
      />
      <div className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-full border border-border/70 bg-background/85 p-1 shadow-sm backdrop-blur">
        {canExport && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={exportPending}
            aria-label="Export visualization"
            onClick={() => setExportDialogOpen(true)}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        <ViewTooltip text={tooltipText} />
      </div>
      <ReactECharts
	        ref={chartRef}
	        option={zoomableOption}
        className={className}
        theme={theme}
        showLoading={loading}
        onEvents={onEvents}
        style={{ height: '100%', width: '100%', ...style }}
      />
    </div>
  );
});
ReactEcharts.displayName = 'ReactEcharts';
export default ReactEcharts;
