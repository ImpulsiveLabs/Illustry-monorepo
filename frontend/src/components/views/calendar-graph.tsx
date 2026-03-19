'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import {
  computeCalendar,
  computeColors,
  computePropertiesForToolTip
} from '@/lib/visualizations/calendar/helper';
import {
  buildLegendOption,
  getChartTopPadding,
  getLegendItems
} from '@/lib/visualizations/legend/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import { useLocale } from '@/components/providers/locale-provider';
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
  const { t } = useLocale();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme
    ? activeTheme.calendar.dark.colors
    : activeTheme.calendar.light.colors;
  const textColor = isDarkTheme ? '#888' : '#333';
  const chartTop = getChartTopPadding(legend);
  const derivedCategories = Array.from(new Set(
    calendar
      .map((event) => (event.category || '').trim())
      .filter((category) => category.length > 0)
  ));
  const legendItems = getLegendItems(
    categories.length > 0 ? categories : derivedCategories
  );
  const computedCalendar = computeCalendar(calendar, textColor);
  const normalizedCalendar = computedCalendar.calendar.map((entry, index) => ({
    ...entry,
    top: chartTop + (index * 200)
  }));
  const categoryColors = computeColors(legendItems, colors);
  const calendarSeries = normalizedCalendar.flatMap((calendarEntry, calendarIndex) => {
    const rangeYear = String(calendarEntry.range);
    const entriesForYear = calendar.filter((event) => {
      const date = new Date(event.date);
      return !Number.isNaN(date.getFullYear()) && `${date.getFullYear()}` === rangeYear;
    });

    return legendItems.map((legendItem) => {
      const categoryData = entriesForYear
        .filter((event) => (event.category || '').trim() === legendItem)
        .map((event) => [event.date, event.value ?? 1, event.category]);

      const isFallbackLegend = legendItems.length === 1 && legendItems[0] === 'Series 1';
      const fallbackData = entriesForYear.map((event) => [event.date, event.value ?? 1, event.category]);

      return {
        name: legendItem,
        type: 'heatmap',
        coordinateSystem: 'calendar',
        calendarIndex,
        data: isFallbackLegend ? fallbackData : categoryData,
        itemStyle: {
          color: categoryColors[legendItem]
        }
      };
    });
  });
  const option = {
    legend: buildLegendOption(legend, legendItems),
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
      top: chartTop + 4,
      type: 'piecewise',
      categories: legendItems,
      textStyle: {
        color: textColor
      },
      inRange: { color: categoryColors }
    },

    calendar: normalizedCalendar,
    series: calendarSeries
  };
  const yearsCount = computedCalendar.calendar.length || 1;
  const fullScreenHeight = Math.min(Math.max(yearsCount * 300, 560), 1800);
  const canvasHeight = fullScreen ? `${fullScreenHeight}px` : '100%';
  return (
    <div className="relative mt-[4%] flex flex-col items-center">
      <div className="w-full h-full">
        <ReactEcharts
          option={option}
          helperText={t('tooltip.calendar')}
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
