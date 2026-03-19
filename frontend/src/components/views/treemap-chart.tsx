/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import {
  calculateMeanValue,
  computeMaxDepth,
  computeNodesHierarchy,
  computeUniqueValues,
  createLevels
} from '@/lib/visualizations/hierarchy-charts/helper';
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

type TreeMapProp = {
  categories: string[];
  nodes: VisualizationTypes.HierarchyNode[];
} & WithLegend
  & WithOptions
  & WithFullScreen

const TreeMapView = ({
  nodes, categories, legend, fullScreen
}: TreeMapProp) => {
  const maxDepth = computeMaxDepth(nodes);
  const meanValue = calculateMeanValue(computeUniqueValues(nodes));
  const levels = createLevels(maxDepth);
  const activeTheme = useThemeColors();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme
    ? activeTheme.treeMap.dark.colors
    : activeTheme.treeMap.light.colors;
  const chartTop = getChartTopPadding(legend);
  const legendItems = useMemo(
    () => getLegendItems(nodes.map((node) => node.name)),
    [nodes]
  );
  const [selectedLegendItems, setSelectedLegendItems] = useState<Record<string, boolean>>(
    () => buildLegendSelectedMap(legendItems)
  );

  useEffect(() => {
    setSelectedLegendItems(buildLegendSelectedMap(legendItems));
  }, [legendItems]);

  const filteredTopLevelNodes = useMemo(
    () => nodes.filter((node) => selectedLegendItems[node.name] !== false),
    [nodes, selectedLegendItems]
  );
  const categoryColorMap = useMemo(
    () => categories.reduce<Record<string, string>>((accumulator, category, index) => {
      accumulator[category] = colors[index % Math.max(colors.length, 1)] || '#888';
      return accumulator;
    }, {}),
    [categories, colors]
  );
  const legendColorMap = useMemo(
    () => legendItems.reduce<Record<string, string>>((accumulator, legendItem, index) => {
      const node = nodes.find((currentNode) => currentNode.name === legendItem);
      accumulator[legendItem] = (node && categoryColorMap[node.category]) || colors[index % Math.max(colors.length, 1)] || '#888';
      return accumulator;
    }, {}),
    [legendItems, nodes, categoryColorMap, colors]
  );

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
      formatter(params: any) {
        return params.data.prop;
      }
    },
    series: [
      {
        type: 'treemap',
        top: chartTop,
        bottom: 16,
        visibleMin: meanValue,
        data: computeNodesHierarchy(filteredTopLevelNodes, categories, colors),
        leafDepth: maxDepth,
        levels
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

export default TreeMapView;
