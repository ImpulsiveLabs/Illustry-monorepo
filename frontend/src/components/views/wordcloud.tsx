'use client';

import { VisualizationTypes } from '@illustry/types';
import {
  computeWords,
  computePropertiesForToolTip
} from '@/lib/visualizations/word-cloud/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import { useThemeColors } from '../providers/theme-provider';
import ReactEcharts from './generic/echarts';

type WordCloudProp = {
  words: VisualizationTypes.WordType[];
} & WithLegend
  & WithOptions
  & WithFullScreen

const WordCloudView = ({ words, fullScreen }: WordCloudProp) => {
  const activeTheme = useThemeColors();
  const theme = typeof window !== 'undefined' ? localStorage.getItem('theme') : 'light';
  const isDarkTheme = theme === 'dark';
  const colors = isDarkTheme
    ? activeTheme.wordcloud.dark.colors
    : activeTheme.wordcloud.light.colors;

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter(params: {
        data: {
          properties: string | Record<string, string | number>;
          value: string | number | undefined;
        };
      }) {
        return computePropertiesForToolTip(
          params.data.properties,
          params.data.value
        );
      }
    },

    series: [
      {
        type: 'wordCloud',
        shape: 'circle',
        data: computeWords(words, colors),
        keepAspect: true,
        left: 'center',
        top: 'center',
        width: '70%',
        height: '80%',
        right: null,
        bottom: null,
        sizeRange: [12, 60],
        rotationRange: [-90, 90],
        rotationStep: 45,
        gridSize: 10,
        emphasis: {
          focus: 'self',

          textStyle: {
            textShadowBlur: 10,
            textShadowColor: '#333'
          }
        }
      }
    ]
  };
  const height = fullScreen ? '73.5vh' : '100%';
  return (
    <div className="w-full h-full">
      <ReactEcharts
        option={option}
        className="w-full sm:h-120 lg:h-160"
        style={{
          height
        }}
      />
    </div>
  );
};
export default WordCloudView;
