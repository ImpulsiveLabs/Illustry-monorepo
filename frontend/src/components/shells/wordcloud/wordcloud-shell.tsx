'use client';

import { VisualizationTypes } from '@illustry/types';
import dynamic from 'next/dynamic';
import {
  WithFilter, WithFullScreen, WithLegend, WithOptions
} from '@/lib/types/utils';
import FilteredWordCloudGraphShellView from './filter-wordcloud-shell';

type WordCloudShellProp = {
  data: VisualizationTypes.WordCloudData;
} & WithLegend
  & WithOptions
  & WithFilter
  & WithFullScreen

const WordCloudGraphView = dynamic(
  () => import('@/components/views/wordcloud'),
  { ssr: false }
);

const WordCloudShellView = ({
  data,
  legend,
  options,
  filter,
  fullScreen
}: WordCloudShellProp) => {
  const { words } = data;
  return (
    <>
      {filter ? (
        <FilteredWordCloudGraphShellView
          options={options}
          words={words}
          legend={legend}
          fullScreen={fullScreen}
        />
      ) : (
        <>
          <WordCloudGraphView
            options={options}
            words={words}
            legend={legend}
            fullScreen={fullScreen}
          />
        </>
      )}
    </>
  );
};

export default WordCloudShellView;
