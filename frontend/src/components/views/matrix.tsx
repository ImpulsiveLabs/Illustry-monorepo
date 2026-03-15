'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { VisualizationTypes } from '@illustry/types';
import { useEffect, useRef } from 'react';
import {
  addStyleTooltipWithHover,
  categoryMap,
  createHeadersAndPropertiesString,
  sortColumns,
  sortRows
} from '@/lib/visualizations/node-link/helper';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import { useThemeColors } from '@/components/providers/theme-provider';

type MatrixProp = {
  nodes: VisualizationTypes.Node[];
  links: VisualizationTypes.Link[];
} & WithLegend & WithOptions & WithFullScreen;

const createMatrix = (nodes: VisualizationTypes.Node[], links: VisualizationTypes.Link[]) => {
  const categories = categoryMap(nodes);
  const categoriesKeys: string[] = Object.keys(categories);
  if (categoriesKeys.length !== 2) {
    return '<table id="myTable"></table>';
  }

  const tableString = `<table id="myTable" style="border-spacing: 0; width: 100%; border: 1px solid #ddd; margin-top: 5%;">${
    createHeadersAndPropertiesString(
      categories[categoriesKeys[0] as string] as VisualizationTypes.Node[],
      categories[categoriesKeys[1] as string] as VisualizationTypes.Node[],
      links
    )}</table>`;
  return tableString;
};

const MatrixView = ({ nodes, links }: MatrixProp) => {
  const tableRef = useRef<HTMLDivElement>(null);
  const activeTheme = useThemeColors();
  const isDarkTheme = getStoredTheme() === 'dark';
  const colors = isDarkTheme
    ? activeTheme.heb.dark.colors
    : activeTheme.heb.light.colors;

  useEffect(() => {
    const tableElement = tableRef.current as HTMLDivElement;
    tableElement.innerHTML = createMatrix(nodes, links);
    sortRows();
    sortColumns();
    addStyleTooltipWithHover();

    return () => {
      const tooltip = document.getElementById('showData');
      if (tooltip) {
        tooltip.remove();
      }
    };
  }, [nodes, links, JSON.stringify(colors)]);

  return <div ref={tableRef}></div>;
};

export default MatrixView;
