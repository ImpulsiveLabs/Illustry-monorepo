'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import {
  computeCategoriesFLGOrHEB,
  computeLinksFLGOrHEB,
  computeNodesFLG
} from '@/lib/visualizations/node-link/helper';
import {
  buildLegendOption,
  getChartTopPadding
} from '@/lib/visualizations/legend/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import { useLocale } from '@/components/providers/locale-provider';
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
  const { t } = useLocale();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme
    ? activeTheme.flg.dark.colors
    : activeTheme.flg.light.colors;

  const categories: {
    name: string;
    itemStyle: { color: string | undefined };
  }[] = computeCategoriesFLGOrHEB(nodes, colors);
  const categoryNames = categories.map((category) => category.name);
  const chartTop = getChartTopPadding(legend);
  const edges = computeLinksFLGOrHEB(links, nodes);
  const option = {
    legend: buildLegendOption(legend, categoryNames),
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
        top: chartTop,
        bottom: 16,
        left: 24,
        right: 24,
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
      <div className="w-full h-full">
        <ReactEcharts
          option={option}
          helperText={t('tooltip.forcedLayout')}
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
