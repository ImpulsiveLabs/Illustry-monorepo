'use client';

import { VisualizationTypes } from '@illustry/types';
import dynamic from 'next/dynamic';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';

type AxisChartsShellProp = {
  data: VisualizationTypes.AxisChartData;
  type: 'line' | 'bar';
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const AxisChartsView = dynamic(() => import('@/components/views/axis-charts'), {
  ssr: false
});

const FilteredAxisChartsShellView = dynamic(
  () => import('@/components/shells/axis/filter-axis-shell'),
  {
    ssr: false
  }
);

const AxisChartsShellView = ({
  data,
  legend,
  options,
  type,
  filter,
  fullScreen
}: AxisChartsShellProp) => (
  <>
    {filter ? (
      <FilteredAxisChartsShellView
        options={options}
        data={data}
        type={type}
        legend={legend}
        fullScreen={fullScreen}
      />
    ) : (
      <>
        <AxisChartsView
          options={options}
          data={data}
          type={type}
          legend={legend}
          fullScreen={fullScreen}
        />
      </>
    )}
  </>
);

export default AxisChartsShellView;
