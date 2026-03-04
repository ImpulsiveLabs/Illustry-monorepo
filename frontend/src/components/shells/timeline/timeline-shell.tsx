'use client';

import dynamic from 'next/dynamic';
import { VisualizationTypes } from '@illustry/types';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';
import FilteredTimelineShellView from './filter-timeline-shell';

type TimelineShellProp = {
  data: VisualizationTypes.TimelineData;
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const TimelineGraphView = dynamic(() => import('@/components/views/timeline'), {
  ssr: false
});

const TimelineShellView = ({
  data,
  legend,
  options,
  filter,
  fullScreen
}: TimelineShellProp) => (
  <>
    {filter ? (
      <FilteredTimelineShellView
        options={options}
        data={data}
        legend={legend}
        fullScreen={fullScreen}
      />
    ) : (
      <>
        <TimelineGraphView
          options={options}
          data={data}
          legend={legend}
          fullScreen={fullScreen}
        />
      </>
    )}
  </>
);

export default TimelineShellView;
