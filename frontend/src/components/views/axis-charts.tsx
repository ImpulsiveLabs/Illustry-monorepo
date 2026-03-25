'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import {
  constructSeries
} from '@/lib/visualizations/chart/helper';
import {
  buildLegendOption,
  getChartTopPadding
} from '@/lib/visualizations/legend/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import { useLocale } from '@/components/providers/locale-provider';
import { useThemeColors } from '../providers/theme-provider';
import ReactEcharts from './generic/echarts';

type AxisChartProp = {
  data: VisualizationTypes.AxisChartData;
  type: 'line' | 'bar';
} & WithLegend
  & WithOptions
  & WithFullScreen

const AxisChartView = ({
  data, type, legend, fullScreen
}: AxisChartProp) => {
  const activeTheme = useThemeColors();
  const { t } = useLocale();
  const themeMode = getStoredTheme() === 'dark' ? 'dark' : 'light';
  const chartTheme = type === 'bar' ? activeTheme.barChart : activeTheme.lineChart;
  const colors = chartTheme[themeMode].colors;

  const { headers, values } = data;
  const legendItems = Object.keys(values || {});
  const option = {
    legend: buildLegendOption(legend, legendItems),
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },

    grid: {
      top: getChartTopPadding(legend),
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: type !== 'line',
        data: headers
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: constructSeries(
      values,
      colors as string[],
      false,
      type,
      false
    )
  };
  const height = fullScreen ? '73.5vh' : '100%';
  return (
    <div className="relative mt-[4%] flex flex-col items-center">
      <div className="w-full h-full">
        <ReactEcharts
          option={option}
          helperText={t('tooltip.axis')}
          className="w-full sm:h-120 lg:h-160"
          style={{
            height
          }}
        />
      </div>
    </div>
  );
};
export default AxisChartView;
