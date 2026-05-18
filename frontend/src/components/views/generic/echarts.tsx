/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, {
  forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState
} from 'react';
import ReactECharts from 'echarts-for-react';
import 'echarts-wordcloud';
import { ChevronDown, Download } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { exportChart, type ChartExportFormat } from '@/lib/chart-export';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings?: any;
  loading?: boolean;
  theme?: 'light' | 'dark';
  style?: React.CSSProperties;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvents?: Record<string, (...args: any[]) => void>;
  helperText?: string;
};

const chartExportFormats: Array<{ label: string; value: ChartExportFormat }> = [
  { label: 'PNG', value: 'png' },
  { label: 'JPG', value: 'jpg' },
  { label: 'WebP', value: 'webp' },
  { label: 'SVG', value: 'svg' }
];

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
  const [pendingFormat, setPendingFormat] = useState<ChartExportFormat | null>(null);
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

  useImperativeHandle(ref, () => ({
    getEchartsInstance: () => chartRef.current?.getEchartsInstance()
  }));

  useEffect(() => {
    const resizeChart = () => {
      chartRef.current?.getEchartsInstance()?.resize();
    };

    window.addEventListener('resize', resizeChart);
    const resizeObserver = new ResizeObserver((_entries, _observer) => {
      resizeChart();
    });
    resizeObserver.observe(containerRef.current as HTMLDivElement);

    return () => {
      window.removeEventListener('resize', resizeChart);
      resizeObserver.disconnect();
    };
  }, []);

  const handleExport = async (format: ChartExportFormat) => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) {
      toast.error('The visualization is not ready to export yet.');
      return;
    }

    setPendingFormat(format);
    try {
      await exportChart({
        chart,
        filename: getVisualizationExportFilename(),
        format
      });
      toast.success(`${format.toUpperCase()} export started`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to export this visualization.');
    } finally {
      setPendingFormat(null);
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div className="absolute right-2 top-2 z-20 flex items-center gap-1 rounded-full border border-border/70 bg-background/85 p-1 shadow-sm backdrop-blur">
        {canExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={Boolean(pendingFormat)}
                aria-label="Export visualization"
              >
                <Download className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel>Save as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {chartExportFormats.map((format) => (
                <DropdownMenuItem
                  key={format.value}
                  onSelect={() => {
                    void handleExport(format.value);
                  }}
                >
                  {format.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
