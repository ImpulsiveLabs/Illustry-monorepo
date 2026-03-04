'use client';

import dynamic from 'next/dynamic';
import { VisualizationTypes } from '@illustry/types';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';
import FilteredHierarchicalEdgeBundlingGraphShellView from './filter-hierarchical-edge-bundling-shell';

type HierarchicalEdgeBundlingShellProp = {
  data: VisualizationTypes.NodeLinkData;
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const HierarchicalEdgeBundlingGraphView = dynamic(
  () => import('@/components/views/hierarchical-edge-bundling'),
  { ssr: false }
);

const HierarchicalEdgeBundlingShellView = ({
  data,
  legend,
  options,
  filter,
  fullScreen
}: HierarchicalEdgeBundlingShellProp) => {
  const { nodes, links } = data;
  return (
    <>
      {filter ? (
        <FilteredHierarchicalEdgeBundlingGraphShellView
          options={options}
          nodes={nodes}
          links={links}
          legend={legend}
          fullScreen={fullScreen}
        />
      ) : (
        <>
          <HierarchicalEdgeBundlingGraphView
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

export default HierarchicalEdgeBundlingShellView;
