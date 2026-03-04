'use client';

import { VisualizationTypes } from '@illustry/types';
import dynamic from 'next/dynamic';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';
import FilteredForcedLayoutGraphShellView from './filter-forced-layout-graph-shell';

type ForcedLayoutGraphShellProp = {
  data: VisualizationTypes.NodeLinkData;
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const ForcedLayoutGraphView = dynamic(
  () => import('@/components/views/forced-layout-graph'),
  { ssr: false }
);

const ForcedLayoutGraphShellView = ({
  data,
  legend,
  options,
  filter,
  fullScreen
}: ForcedLayoutGraphShellProp) => {
  const { nodes, links } = data;
  return (
    <>
      {filter ? (
        <FilteredForcedLayoutGraphShellView
          options={options}
          nodes={nodes}
          links={links}
          legend={legend}
          fullScreen={fullScreen}
        />
      ) : (
        <>
          <ForcedLayoutGraphView
            options={options}
            nodes={nodes}
            links={links}
            legend={legend}
            fullScreen={fullScreen}
          />
        </>
      )}
    </>
  );
};

export default ForcedLayoutGraphShellView;
