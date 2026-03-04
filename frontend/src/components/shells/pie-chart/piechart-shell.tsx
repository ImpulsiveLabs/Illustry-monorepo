'use client';

import { VisualizationTypes } from '@illustry/types';
import dynamic from 'next/dynamic';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';
import FilteredPieChartGraphShellView from './filter-piechart-shell';

type PieChartShellProp = {
  data: VisualizationTypes.PieChartData;
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const PieChartGraphView = dynamic(
  () => import('@/components/views/pie-chart'),
  { ssr: false }
);

const PieChartShellView = ({
  data,
  legend,
  options,
  filter,
  fullScreen
}: PieChartShellProp) => (
  <>
    {filter ? (
      <FilteredPieChartGraphShellView
        options={options}
        data={data}
        legend={legend}
        fullScreen={fullScreen} />
    ) : (
      <>
        <PieChartGraphView
          options={options}
          data={data}
          legend={legend}
          fullScreen={fullScreen} />
      </>
    )}
  </>
);

export default PieChartShellView;
