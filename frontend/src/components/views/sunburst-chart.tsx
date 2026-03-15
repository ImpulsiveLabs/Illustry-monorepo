/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import {
  computeNodesHierarchy
} from '@/lib/visualizations/hierarchy-charts/helper';
import { computeLegendColors } from '@/lib/visualizations/calendar/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import Legend from '../ui/legend';
import { useThemeColors } from '../providers/theme-provider';
import ReactEcharts from './generic/echarts';

type SunburstViewProp = {
  nodes: VisualizationTypes.HierarchyNode[];
  categories: string[]
} & WithLegend
  & WithOptions
  & WithFullScreen

const SunburstView = ({
  nodes, categories, legend, fullScreen
}: SunburstViewProp) => {
  const activeTheme = useThemeColors();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme
    ? activeTheme.sunburst.dark.colors
    : activeTheme.sunburst.light.colors;

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter(params: any) {
        return params.data.prop;
      }
    },
    series: [
      {
        type: 'sunburst',
        data: computeNodesHierarchy(nodes, categories, colors)
      }
    ]
  };
  const height = fullScreen ? '73.5vh' : '100%';

  return (
    <div className="relative mt-[4%] flex flex-col items-center">
      {legend && (
        <Legend legendData={computeLegendColors(categories, colors)} />
      )}
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

export default SunburstView;
