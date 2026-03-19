'use client';

import { useEffect, useMemo, useState } from 'react';
import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import {
  computeCategoriesSankey,
  computeNodesSankey
} from '@/lib/visualizations/node-link/helper';
import {
  buildLegendProxySeries,
  buildLegendOption,
  buildLegendSelectedMap,
  getChartTopPadding,
  getLegendItems
} from '@/lib/visualizations/legend/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
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
  const rawCategories = useMemo(
    () => computeCategoriesSankey(nodes)
      .map((category) => `${category ?? ''}`.trim())
      .filter((category) => category.length > 0),
    [nodes]
  );
  const useCategoryLegend = rawCategories.length > 0;
  const legendItems = useMemo(
    () => getLegendItems(useCategoryLegend ? rawCategories : nodes.map((node) => node.name)),
    [rawCategories, nodes, useCategoryLegend]
  );
  const [selectedLegendItems, setSelectedLegendItems] = useState<Record<string, boolean>>(
    () => buildLegendSelectedMap(legendItems)
  );
  useEffect(() => {
    setSelectedLegendItems(buildLegendSelectedMap(legendItems));
  }, [legendItems]);

  const filteredNodes = useMemo(
    () => nodes.filter((node) => {
      const categoryKey = `${node.category ?? ''}`.trim();
      if (useCategoryLegend) {
        return selectedLegendItems[categoryKey] !== false;
      }
      return selectedLegendItems[node.name] !== false;
    }),
    [nodes, selectedLegendItems, useCategoryLegend]
  );
  const filteredNodeNames = useMemo(
    () => new Set(filteredNodes.map((node) => node.name)),
    [filteredNodes]
  );
  const filteredLinks = useMemo(
    () => links.filter(
      (link) => filteredNodeNames.has(link.source) && filteredNodeNames.has(link.target)
    ),
    [links, filteredNodeNames]
  );
  const categoriesForColor = useCategoryLegend ? rawCategories : legendItems;
  const legendColorMap = useMemo(() => legendItems.reduce<Record<string, string>>((accumulator, item, index) => {
    accumulator[item] = colors[index % Math.max(colors.length, 1)] || '#888';
    return accumulator;
  }, {}), [legendItems, colors]);
  const chartTop = getChartTopPadding(legend);
  const onEvents = {
    legendselectchanged: (params: { selected?: Record<string, boolean> }) => {
      setSelectedLegendItems(params.selected || buildLegendSelectedMap(legendItems));
    }
  };

  const option = {
    legend: {
      ...buildLegendOption(legend, legendItems),
      selected: selectedLegendItems
    },
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
        top: chartTop,
        bottom: 16,
        emphasis: {
          focus: 'adjacency'
        },
        nodeAlign: 'right',
        data: computeNodesSankey(filteredNodes, categoriesForColor, colors),
        links: filteredLinks,
        lineStyle: {
          color: 'source',
          curveness: 0.5
        }
      },
      buildLegendProxySeries(legendItems, legendColorMap)
    ]
  };
  const height = fullScreen ? '73.5vh' : '100%';

  return (
    <div className="relative mt-[4%] flex flex-col items-center">
      <div className="w-full h-full">
        <ReactEcharts
          option={option}
          onEvents={onEvents}
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
