/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
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
  style?: object;
};

// Updated ReactEcharts Component with forwardRef
const ReactEcharts = forwardRef(<T, >(
  {
    option, className, loading, theme, style
  }: ReactEChartsProps<T>,
  ref: React.Ref<unknown> | undefined
) => {
  const chartRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    // eslint-disable-next-line consistent-return
    getEchartsInstance: () => {
      if (chartRef.current) {
        return chartRef.current.getEchartsInstance();
      }
    }
  }));

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      className={className}
      theme={theme}
      showLoading={loading}
      style={style}
    />
  );
});
ReactEcharts.displayName = 'ReactEcharts';
export default ReactEcharts;
