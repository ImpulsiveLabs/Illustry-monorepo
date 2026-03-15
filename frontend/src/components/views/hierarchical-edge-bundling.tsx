/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import { useEffect, useRef } from 'react';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import { computeCategoriesFLGOrHEB, computeNodesHEB } from '@/lib/visualizations/node-link/helper';
import { useThemeColors } from '../providers/theme-provider';
import ReactEcharts from './generic/echarts';

type HierarchicalEdgeBundlingGraphProp = {
  nodes: VisualizationTypes.Node[];
  links: VisualizationTypes.Link[];
} & WithLegend
  & WithOptions
  & WithFullScreen

const HierarchicalEdgeBundlingGraphView = ({ nodes, links, fullScreen }: HierarchicalEdgeBundlingGraphProp) => {
  const activeTheme = useThemeColors();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme ? activeTheme.flg.dark.colors : activeTheme.flg.light.colors;
  const categories = computeCategoriesFLGOrHEB(nodes, colors);
  const chartRef = useRef(null);
  const recomputedNodes = computeNodesHEB(nodes, categories);
  const inOutColors = colors.slice(categories.length);
  const option = {
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          // eslint-disable-next-line max-len
          return `${params.data.source} → ${params.data.target}<br />Value: ${params.data.value || 0} ${params.data.prop ? `<br/> ${params.data.prop}` : ''}`;
        }
        return `${params.data.name} ${params.data.prop ? `<br/> ${params.data.prop}` : ''}`;
      }
    },
    animationDurationUpdate: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
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
    const chartInstance = (chartRef.current as any)?.getEchartsInstance();
    chartInstance?.on('mouseover', (params: any) => {
      let newLinks: Record<string, unknown>[] = [...links];
      if (params.dataType === 'node') {
        const nodeId = params.data.id;
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
        // eslint-disable-next-line max-len
        const foundlinkIndex = links.findIndex((link) => link.target === mouseOverLink.target && link.source === mouseOverLink.source);
        newLinks[foundlinkIndex] = {
          ...links[foundlinkIndex],
          lineStyle: {
            width: 5
          }
        };
      }
      chartInstance.setOption({
        series: [
          {
            edges: newLinks
          }
        ]
      });
    });

    chartInstance?.on('mouseout', (params: any) => {
      if (params.dataType === 'node' || params.dataType === 'edge') {
        chartInstance.setOption({
          series: [
            {
              edges: links
            }
          ]
        });
      }
    });
  }, [links, nodes]);
  const height = fullScreen ? '73.5vh' : '100%';
  return (
    <div className="relative mt-[4%] flex flex-col items-center">
      <div className="w-full h-full">
        <ReactEcharts
          ref={chartRef}
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

export default HierarchicalEdgeBundlingGraphView;
