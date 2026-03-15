'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import {
  computeLegendColors,
  computeValues
} from '@/lib/visualizations/pieFunnel/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import Legend from '../ui/legend';
import { useThemeColors } from '../providers/theme-provider';
import ReactEcharts from './generic/echarts';

type FunnelProp = {
  data: VisualizationTypes.FunnelData;
} & WithLegend
  & WithOptions
  & WithFullScreen

const FunnelView = ({ data, legend, fullScreen }: FunnelProp) => {
  const activeTheme = useThemeColors();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme
    ? activeTheme.funnel.dark.colors
    : activeTheme.funnel.light.colors;

  const option = {
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        type: 'funnel',
        minSize: '0%',
        maxSize: '100%',
        gap: 2,
        label: {
          show: true,
          position: 'inside'
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: 'solid'
          }
        },
        emphasis: {
          label: {
            fontSize: 20
          }
        },
        data: computeValues(data, colors)
      }
    ]
  };
  const height = fullScreen ? '73.5vh' : '100%';
  return (
    <div className="relative mt-[4%] flex flex-col items-center">
      {legend && <Legend legendData={computeLegendColors(data, colors)} />}
      <div className="w-full h-full">
        <ReactEcharts
          option={option}
          className="w-full sm:h-120 lg:h-160"
          style={{
            height
          }}
        />
      </div>
    </div>
  );
};
export default FunnelView;
