'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import {
  computeCategoriesSankey,
  computeNodesSankey
} from '@/lib/visualizations/node-link/helper';
import { computeLegendColors } from '@/lib/visualizations/calendar/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import Legend from '../ui/legend';
import { useThemeColors } from '../providers/theme-provider';
import ReactEcharts from './generic/echarts';

type SankeyGraphProp = {
  links: VisualizationTypes.Link[],
  nodes: VisualizationTypes.Node[],
} & WithLegend
  & WithOptions
  & WithFullScreen

const SankeyGraphView = ({
  links,
  nodes,
  fullScreen = true,
  legend
}: SankeyGraphProp) => {
  const activeTheme = useThemeColors();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme
    ? activeTheme.sankey.dark.colors
    : activeTheme.sankey.light.colors;
  const categories: string[] = computeCategoriesSankey(nodes);

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(params: any) {
        return params.data.prop;
      }
    },

    animation: false,
    emphasis: {
      focus: 'adjacency',
      lineStyle: {
        width: 3
      }
    },
    series: [
      {
        type: 'sankey',
        emphasis: {
          focus: 'adjacency'
        },
        nodeAlign: 'right',
        data: computeNodesSankey(nodes, categories, colors),
        links,
        lineStyle: {
          color: 'source',
          curveness: 0.5
        }
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
export default SankeyGraphView;
