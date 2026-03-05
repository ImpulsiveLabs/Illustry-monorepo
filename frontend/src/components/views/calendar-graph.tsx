'use client';

import { CalendarOption } from 'echarts/types/dist/shared';
import { VisualizationTypes } from '@illustry/types';
import {
  computeCalendar,
  computeColors,
  computeLegendColors,
  computePropertiesForToolTip
} from '@/lib/visualizations/calendar/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import Legend from '../ui/legend';
import { useThemeColors } from '../providers/theme-provider';
import ReactEcharts from './generic/echarts';

type CalendarGraphProp = {
  categories: string[];
  calendar: VisualizationTypes.CalendarType[];
} & WithLegend
  & WithOptions
  & WithFullScreen

const CalendarGraphView = ({
  categories, calendar, legend, fullScreen
}: CalendarGraphProp) => {
  const activeTheme = useThemeColors();
  const theme = typeof window !== 'undefined' ? localStorage.getItem('theme') : 'light';
  const isDarkTheme = theme === 'dark';
  const colors = isDarkTheme
    ? activeTheme.calendar.dark.colors
    : activeTheme.calendar.light.colors;
  const textColor = isDarkTheme ? '#888' : '#333';
  const computedCalendar = computeCalendar(calendar, textColor);
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter(params: { data: string| Record<string, unknown>[]; }) {
        if (params && params.data && params.data.length) {
          const element = (calendar as VisualizationTypes.CalendarType[]).find((el) => el.date === params.data[0]);
          if (element) {
            if (element.properties) {
              return computePropertiesForToolTip(
                element.properties as string | Record<string, string | number>,
                element.value
              );
            }
            return computePropertiesForToolTip(null, element.value);
          }
        }
        return '';
      }
    },
    visualMap: {
      show: false,
      orient: 'horizontal',
      left: 'center',
      top: 30,
      type: 'piecewise',
      categories,
      textStyle: {
        color: textColor
      },
      inRange: { color: computeColors(categories, colors) }
    },

    calendar: computedCalendar.calendar as CalendarOption,
    series: computedCalendar.series
  };
  const yearsCount = computedCalendar.calendar.length || 1;
  const fullScreenHeight = Math.min(Math.max(yearsCount * 300, 560), 1800);
  const canvasHeight = fullScreen ? `${fullScreenHeight}px` : '100%';
  return (
    <div className="relative mt-[4%] flex flex-col items-center">
      {legend && (
        <Legend legendData={computeLegendColors(categories, colors)} />
      )}
      <div className="w-full h-full">
        <ReactEcharts
          option={option}
          className="w-full sm:h-120 lg:h-160"
          style={{
            height: canvasHeight
          }}
        />
      </div>
    </div>
  );
};
export default CalendarGraphView;
