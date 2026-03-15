'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import {
  computeCategoriesFLGOrHEB,
  computeLinksFLGOrHEB,
  computeNodesFLG
} from '@/lib/visualizations/node-link/helper';
import { computeLegendColors } from '@/lib/visualizations/calendar/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import Legend from '../ui/legend';
import { useThemeColors } from '../providers/theme-provider';
import ReactEcharts from './generic/echarts';

type ForcedLayoutGraphProp = {
  nodes: VisualizationTypes.Node[];
  links: VisualizationTypes.Link[];
} & WithLegend
  & WithOptions
  & WithFullScreen

const ForcedLayoutGraphView = ({
  nodes, links, legend, fullScreen
}: ForcedLayoutGraphProp) => {
  const activeTheme = useThemeColors();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme
    ? activeTheme.flg.dark.colors
    : activeTheme.flg.light.colors;

  const categories: {
    name: string;
    itemStyle: { color: string | undefined };
  }[] = computeCategoriesFLGOrHEB(nodes, colors);
  const edges = computeLinksFLGOrHEB(links, nodes);
  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter(params: any) {
        return params.data.prop;
      }
    },

    series: [
      {
        type: 'graph',
        layout: 'force',
        animation: false,
        label: {
          position: 'right',
          formatter: '{b}'
        },
        draggable: true,
        data: computeNodesFLG(nodes, categories),
        categories,
        force: {
          initLayout: 'circular',
          edgeLength: 300,
          repulsion: 20,
          gravity: 0.2
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 3
          }
        },
        edges
      }
    ]
  };
  const height = fullScreen ? '73.5vh' : '100%';
  return (
    <div className="relative mt-[4%] flex flex-col items-center">
      {legend && (
        <Legend
          legendData={computeLegendColors(
            categories.map((category) => category.name),
            colors
          )}
        />
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
export default ForcedLayoutGraphView;
