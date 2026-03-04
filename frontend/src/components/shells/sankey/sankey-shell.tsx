'use client';

import { VisualizationTypes } from '@illustry/types';
import dynamic from 'next/dynamic';
import {
  computeLinksSankey
} from '@/lib/visualizations/node-link/helper';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';
import FilteredSankeyGraphShellView from './filter-sankey-shell';

type SankeyGraphShellProp = {
  data: VisualizationTypes.NodeLinkData;
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const SankeyGraphView = dynamic(
  () => import('@/components/views/sankey-diagram'),
  { ssr: false }
);

const SankeyGraphShellView = ({
  data,
  fullScreen = true,
  legend,
  options,
  filter
}: SankeyGraphShellProp) => {
  const { nodes, links } = data;
  const newLinks = computeLinksSankey(links);
  return (
    <>
      {filter ? (
        <FilteredSankeyGraphShellView
          fullScreen={fullScreen}
          options={options}
          nodes={nodes}
          links={newLinks as VisualizationTypes.Link[]}
          legend={legend}
        />
      ) : (
        <>
          <SankeyGraphView
            fullScreen={fullScreen}
            options={options}
            nodes={nodes}
            links={newLinks as VisualizationTypes.Link[]}
            legend={legend}
          />
        </>
      )}
    </>
  );
};

export default SankeyGraphShellView;
