'use client';

import dynamic from 'next/dynamic';
import { VisualizationTypes } from '@illustry/types';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';
import FilteredMatrixShellView from './filter-matrix-shell';

type MatrixShellProp = {
  data: VisualizationTypes.NodeLinkData;
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const MatrixGraphView = dynamic(() => import('@/components/views/matrix'), {
  ssr: false
});

const MatrixShellView = ({
  data,
  legend,
  options,
  filter,
  fullScreen
}: MatrixShellProp) => {
  const { nodes, links } = data;
  return (
    <>
      {filter ? (
        <FilteredMatrixShellView
          options={options}
          nodes={nodes}
          links={links}
          legend={legend}
          fullScreen={fullScreen}
        />
      ) : (
        <>
          <MatrixGraphView
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

export default MatrixShellView;
