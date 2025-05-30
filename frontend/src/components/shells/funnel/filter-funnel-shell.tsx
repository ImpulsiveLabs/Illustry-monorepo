'use client';

import { VisualizationTypes } from '@illustry/types';
import { Dispatch, SetStateAction, useState } from 'react';
import dynamic from 'next/dynamic';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import CollapsableSearchBar from '../../ui/collapsable-searchbar';

type FilteredFunnelShellProp = {
  data: VisualizationTypes.FunnelData
} & WithLegend
  & WithOptions
  & WithFullScreen

const FunnelView = dynamic(
  () => import('@/components/views/funnel-chart'),
  { ssr: false }
);

const FilteredFunnelShellView = ({
  data,
  legend,
  options,
  fullScreen
}: FilteredFunnelShellProp) => {
  const [filteredData, setFilteredData] = useState<VisualizationTypes.FunnelData>(data);

  return (
    <>
      <CollapsableSearchBar
        data={data}
        setFilteredData={
          setFilteredData as Dispatch<
            SetStateAction<VisualizationTypes.FunnelData>
          >
        }
        type={VisualizationTypes.VisualizationTypesEnum.FUNNEL}
      />
      <FunnelView
        options={options}
        data={filteredData}
        legend={legend}
        fullScreen={fullScreen}
      />
    </>
  );
};

export default FilteredFunnelShellView;
