import { VisualizationTypes } from '@illustry/types';
import dynamic from 'next/dynamic';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';
import {
  computeCategoriesScatter,
  computePoints
} from '@/lib/visualizations/scatter/helper';
import FilteredScatterGraphShellView from './filter-scatter-shell';

type ScatterShellProp = {
  data: VisualizationTypes.ScatterData;
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const ScatterGraphView = dynamic(() => import('@/components/views/scatter'), {
  ssr: false
});

const ScatterShellView = ({
  data,
  legend,
  options,
  filter,
  fullScreen
}: ScatterShellProp) => {
  const { points } = data;
  const computedPoints = computePoints(points);
  const categories = computeCategoriesScatter(points);
  return (
    <>
      {filter ? (
        <FilteredScatterGraphShellView
          options={options}
          points={computedPoints as (string | number)[][]}
          categories={categories}
          legend={legend}
          fullScreen={fullScreen}
        />
      ) : (
        <>
          <ScatterGraphView
            options={options}
            points={computedPoints as (string | number)[][]}
            categories={categories}
            legend={legend}
            fullScreen={fullScreen}
          />
        </>
      )}
    </>
  );
};

export default ScatterShellView;
