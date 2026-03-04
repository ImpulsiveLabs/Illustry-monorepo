'use client';

import { VisualizationTypes } from '@illustry/types';
import dynamic from 'next/dynamic';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';
import { computeCategoriesCalendar } from '@/lib/visualizations/calendar/helper';
import FilteredCalendarShellView from './filter-calendar-shell';

type CalendarGraphShellProp = {
  data: VisualizationTypes.CalendarData;
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const CalendarGraphView = dynamic(
  () => import('@/components/views/calendar-graph'),
  { ssr: false }
);

const CalendarGraphShellView = ({
  data,
  legend,
  options,
  filter,
  fullScreen
}: CalendarGraphShellProp) => {
  const { calendar } = data;
  const categories = computeCategoriesCalendar(calendar);

  return (
    <>
      {filter ? (
        <FilteredCalendarShellView
          options={options}
          calendar={calendar}
          categories={categories}
          legend={legend}
          fullScreen={fullScreen}
        />
      ) : (
        <>
          <CalendarGraphView
            options={options}
            calendar={calendar}
            categories={categories}
            legend={legend}
            fullScreen={fullScreen}
          />
        </>
      )}
    </>
  );
};

export default CalendarGraphShellView;
