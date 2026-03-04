'use client';

import dynamic from 'next/dynamic';
import { VisualizationTypes } from '@illustry/types';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';
import { computeCategories } from '@/lib/visualizations/hierarchy-charts/helper';
import FilteredTreemapShellView from './filter-treemap-shell';

type TreeMapShellProp = {
  data: VisualizationTypes.HierarchyData;
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const TreeMapView = dynamic(() => import('@/components/views/treemap-chart'), {
  ssr: false
});

const TreeMapShellView = ({
  data,
  legend,
  options,
  filter,
  fullScreen
}: TreeMapShellProp) => {
  const { nodes } = data;
  const categories = computeCategories(nodes);
  return (
    <>
      {filter ? (
        <FilteredTreemapShellView
          options={options}
          nodes={nodes}
          categories={categories}
          legend={legend}
          fullScreen={fullScreen}
        />
      ) : (
        <>
          <TreeMapView
            options={options}
            nodes={nodes}
            categories={categories}
            legend={legend}
            fullScreen={fullScreen}
          />
        </>
      )}
    </>
  );
};

export default TreeMapShellView;
