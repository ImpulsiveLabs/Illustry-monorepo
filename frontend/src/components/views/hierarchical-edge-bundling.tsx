'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import { useEffect, useMemo, useRef } from 'react';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import { computeCategoriesFLGOrHEB, computeNodesHEB } from '@/lib/visualizations/node-link/helper';
import {
  buildLegendOption,
  getChartTopPadding
} from '@/lib/visualizations/legend/helper';
import { useThemeColors } from '../providers/theme-provider';
import { useLocale } from '../providers/locale-provider';
import ReactEcharts from './generic/echarts';

type HierarchicalEdgeBundlingGraphProp = {
  nodes: VisualizationTypes.Node[];
  links: VisualizationTypes.Link[];
} & WithLegend
  & WithOptions
  & WithFullScreen

type EChartsLike = {
  on: (eventName: 'mouseover' | 'mouseout', handler: (params: HebMouseParams) => void) => void;
  off?: (eventName: 'mouseover' | 'mouseout', handler: (params: HebMouseParams) => void) => void;
  setOption: (option: unknown) => void;
};

type EChartsHandle = {
  getEchartsInstance?: () => EChartsLike | undefined;
};

type HebMouseParams = {
  dataType?: string;
  data?: {
    id?: string;
    name?: string;
    prop?: string;
    source?: string;
    target?: string;
    value?: number | string;
  };
};

const HierarchicalEdgeBundlingGraphView = ({
  nodes, links, legend, fullScreen
}: HierarchicalEdgeBundlingGraphProp) => {
  const activeTheme = useThemeColors();
  const { t } = useLocale();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme ? activeTheme.heb.dark.colors : activeTheme.heb.light.colors;
  const categories = computeCategoriesFLGOrHEB(nodes, colors);
  const categoryNames = categories.map((category) => category.name);
  const chartTop = getChartTopPadding(legend);
  const chartRef = useRef<EChartsHandle | null>(null);
  const recomputedNodes = computeNodesHEB(nodes, categories);
  const inOutColors = useMemo(() => colors.slice(categories.length), [categories.length, colors]);
  const option = {
    legend: buildLegendOption(legend, categoryNames),
    tooltip: {
      formatter: (params: HebMouseParams) => {
        if (params.dataType === 'edge') {
          const data = params.data || {};
          const extra = data.prop ? `<br/> ${data.prop}` : '';
          return `${data.source} → ${data.target}<br />Value: ${data.value || 0} ${extra}`;
        }
        const data = params.data || {};
        return `${data.name} ${data.prop ? `<br/> ${data.prop}` : ''}`;
      }
    },
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        top: chartTop,
        bottom: 16,
        left: 24,
        right: 24,
        layout: 'circular',
        circular: {
          rotateLabel: true
        },
        data: recomputedNodes,
        categories,
        roam: true,
        label: {
          position: 'right',
          formatter: '{b}'
        },
        lineStyle: {
          color: '#ccc',
          curveness: 0.3
        },
        edges: links
      }
    ]
  };
  useEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance?.();
    const handleMouseOver = (params: HebMouseParams) => {
      let newLinks: Record<string, unknown>[] = [...links];
      if (params.dataType === 'node') {
        const nodeId = params.data?.id;
        newLinks = links.map((link) => {
          if (link.source === nodeId) {
            return { ...link, lineStyle: { color: inOutColors[0], width: 3 } };
          } if (link.target === nodeId) {
            return { ...link, lineStyle: { color: inOutColors[1], width: 3 } };
          }
          return { ...link };
        });
      }
      if (params.dataType === 'edge') {
        const mouseOverLink = params.data;
        const foundlinkIndex = links.findIndex(
          (link) => link.target === mouseOverLink?.target && link.source === mouseOverLink?.source
        );
        if (foundlinkIndex >= 0) {
          newLinks[foundlinkIndex] = {
            ...links[foundlinkIndex],
            lineStyle: {
              width: 5
            }
          };
        }
      }
      chartInstance?.setOption({
        series: [
          {
            edges: newLinks
          }
        ]
      });
    };

    const handleMouseOut = (params: HebMouseParams) => {
      if (params.dataType === 'node' || params.dataType === 'edge') {
        chartInstance?.setOption({
          series: [
            {
              edges: links
            }
          ]
        });
      }
    };

    chartInstance?.on('mouseover', handleMouseOver);
    chartInstance?.on('mouseout', handleMouseOut);

    return () => {
      chartInstance?.off?.('mouseover', handleMouseOver);
      chartInstance?.off?.('mouseout', handleMouseOut);
    };
  }, [inOutColors, links]);
  const height = fullScreen ? '73.5vh' : '100%';
  return (
    <div className="relative mt-[4%] flex flex-col items-center">
      <div className="w-full h-full">
        <ReactEcharts
          ref={chartRef}
          option={option}
          helperText={t('tooltip.heb')}
          className="w-full sm:h-120 lg:h-160"
          style={{
            height
          }}
        />
      </div>
    </div>
  );
};

export default HierarchicalEdgeBundlingGraphView;
