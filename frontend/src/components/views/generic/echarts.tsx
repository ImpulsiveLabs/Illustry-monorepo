/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, {
  forwardRef, useEffect, useImperativeHandle, useRef
} from 'react';
import ReactECharts from 'echarts-for-react';
import 'echarts-wordcloud';
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

// Updated ReactEcharts Component with forwardRef
const ReactEcharts = forwardRef(<T, >(
  {
    option, className, loading, theme, style, onEvents, helperText
  }: ReactEChartsProps<T>,
  ref: React.Ref<unknown> | undefined
) => {
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { t } = useLocale();
  const tooltipText = helperText || t('tooltip.generic');

  useImperativeHandle(ref, () => ({
    getEchartsInstance: () => chartRef.current?.getEchartsInstance()
  }));

  useEffect(() => {
    const resizeChart = () => {
      chartRef.current?.getEchartsInstance()?.resize();
    };

    window.addEventListener('resize', resizeChart);
    const resizeObserver = new ResizeObserver(() => resizeChart());
    resizeObserver.observe(containerRef.current as HTMLDivElement);

    return () => {
      window.removeEventListener('resize', resizeChart);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <div className="absolute right-2 top-2 z-20">
        <ViewTooltip text={tooltipText} />
      </div>
      <ReactECharts
        ref={chartRef}
        option={option}
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
