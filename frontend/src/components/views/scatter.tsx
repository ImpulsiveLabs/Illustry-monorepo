'use client';

import {
  computeColors
} from '@/lib/visualizations/scatter/helper';
import {
  buildLegendOption,
  getChartTopPadding,
  getLegendItems
} from '@/lib/visualizations/legend/helper';
import { getStoredTheme } from '@/lib/theme-mode';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import { useLocale } from '@/components/providers/locale-provider';
import { useThemeColors } from '../providers/theme-provider';
import ReactEcharts from './generic/echarts';

type ScatterProp = {
  points: (string | number)[][];
  categories: string[];
} & WithLegend
  & WithOptions
  & WithFullScreen

const ScatterView = ({
  points, categories, legend, fullScreen
}: ScatterProp) => {
  const activeTheme = useThemeColors();
  const { t } = useLocale();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme
    ? activeTheme.scatter.dark.colors
    : activeTheme.scatter.light.colors;
  const chartTop = getChartTopPadding(legend);
  const derivedCategories = Array.from(new Set(
    points
      .map((point) => `${point[2] ?? ''}`.trim())
      .filter((category) => category.length > 0)
  ));
  const legendItems = getLegendItems(
    categories.length > 0 ? categories : derivedCategories
  );
  const colorMap = computeColors(legendItems, colors);
  const fallbackLegend = legendItems.length === 1 && legendItems[0] === 'Series 1';

  const textColor = isDarkTheme ? '#888' : '#333';
  const option = {
    legend: buildLegendOption(legend, legendItems),
    tooltip: {
      formatter: '<b>({c})</b>',
      axisPointer: {
        type: 'cross',
        lineStyle: {
          type: 'dashed',
          width: 1
        }
      }
    },

    grid: {
      top: chartTop,
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'value',
        scale: true,

        splitLine: {
          show: false
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        scale: true,
        splitLine: {
          show: false
        }
      }
    ],
    visualMap: {
      show: false,
      orient: 'horizontal',
      left: 'center',
      top: chartTop + 4,
      type: 'piecewise',
      categories: legendItems,
      textStyle: {
        color: textColor
      },
      inRange: { color: colorMap }
    },
    series: legendItems.map((legendItem) => ({
      name: legendItem,
      type: 'scatter',
      emphasis: {
        focus: 'series'
      },
      itemStyle: {
        color: colorMap[legendItem]
      },
      data: fallbackLegend
        ? points
        : points.filter((point) => `${point[2] ?? ''}`.trim() === legendItem)
    }))
  };
  const height = fullScreen ? '73.5vh' : '100%';

  return (
    <div className="relative mt-[4%] flex flex-col items-center">
      <div className="w-full h-full">
        <ReactEcharts
          option={option}
          helperText={t('tooltip.scatter')}
          className="w-full sm:h-120 lg:h-160"
          style={{
            height
          }}
        />
      </div>
    </div>
  );
};
export default ScatterView;
