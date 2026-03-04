'use client';

import { VisualizationTypes } from '@illustry/types';
import dynamic from 'next/dynamic';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';
import FilteredFunnelShellView from './filter-funnel-shell';

type FunnelShellProp = {
  data: VisualizationTypes.FunnelData;
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const FunnelView = dynamic(() => import('@/components/views/funnel-chart'), {
  ssr: false
});

const FunnelShellView = ({
  data,
  legend,
  options,
  filter,
  fullScreen
}: FunnelShellProp) => (
  <>
    {filter ? (
      <FilteredFunnelShellView
        options={options}
        data={data}
        legend={legend}
        fullScreen={fullScreen}
      />
    ) : (
      <>
        <FunnelView
          options={options}
          data={data}
          legend={legend}
          fullScreen={fullScreen}
        />
      </>
    )}
  </>
);

export default FunnelShellView;
