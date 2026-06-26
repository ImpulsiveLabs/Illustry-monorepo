import { promises as fs } from 'fs';
import path from 'path';
import {
  IllustryError,
  createLocalExportBundle,
  importVisualizationSource,
  parseImportMapping,
  parseExportFormats,
  type IllustryChartPayload,
  type ImportColumnMapping,
  type ServerResource
} from '@illustry/core';
import { CliContext } from '../context';
import type { ResourceName } from '../types';

type ImportOptions = {
  file?: string;
  name?: string;
  type?: string;
  description?: string;
  tags?: string[];
  fullDetails?: boolean;
  mapping?: string | ImportColumnMapping;
  fileType?: 'JSON' | 'CSV' | 'EXCEL' | 'XML';
  includeHeaders?: boolean;
  sheets?: string;
  separator?: string;
  frontendMapping?: Record<string, string>;
  labelColumn?: string;
  valueColumn?: string;
};

type FrontendFileType = 'JSON' | 'CSV' | 'EXCEL' | 'XML';

type ListOptions = {
  resource?: string;
  text?: string;
  page?: string;
  sort?: string;
  sharedScope?: string;
};

type ExportOptions = {
  asset?: string;
  resource?: string;
  format?: string;
  out?: string;
  type?: string;
  title?: string;
  chartFile?: string;
};

type DeleteOptions = {
  resource?: string;
  name?: string;
  type?: string;
};

type ProjectMutationOptions = {
  name?: string;
  description?: string;
  active?: boolean;
};

type ProjectQueryOptions = ListOptions & {
  name?: string;
  perPage?: string;
};

type DashboardMutationOptions = {
  name?: string;
  description?: string;
  visualizations?: Record<string, string>;
};

type DashboardQueryOptions = ListOptions & {
  name?: string;
  perPage?: string;
};

type DashboardExportOptions = {
  name?: string;
  format?: string;
  out?: string;
  chartFile?: string;
  title?: string;
};

type DashboardBundleFormat = 'png' | 'jpg' | 'webp' | 'svg' | 'web-component' | 'excel' | 'pdf' | 'word' | 'ppt';
type VisualizationBundleFormat = DashboardBundleFormat;

type VisualizationQueryOptions = ListOptions & {
  name?: string;
  perPage?: string;
};

type VisualizationIdentityOptions = {
  name?: string;
  type?: string;
};

type VisualizationExportOptions = VisualizationIdentityOptions & {
  format?: string;
  out?: string;
  chartFile?: string;
  title?: string;
};

const normalizeListResource = (value?: string): ResourceName => {
  if (!value || value === 'assets') return 'assets';
  if (value === 'project') return 'projects';
  if (value === 'visualization') return 'visualizations';
  if (value === 'dashboard') return 'dashboards';
  if (value === 'projects' || value === 'visualizations' || value === 'dashboards') return value;
  throw new IllustryError(`Unsupported resource "${value}".`, {
    code: 'ILLUSTRY_CLI_UNSUPPORTED_RESOURCE',
    status: 400
  });
};

const normalizeServerResource = (value: ResourceName): ServerResource => {
  if (value === 'assets') {
    return 'visualizations';
  }
  return value;
};

const normalizeExportResource = (value?: string): 'visualization' | 'dashboard' => {
  if (!value || value === 'visualization' || value === 'visualizations') return 'visualization';
  if (value === 'dashboard' || value === 'dashboards') return 'dashboard';
  throw new IllustryError(`Unsupported export resource "${value}".`, {
    code: 'ILLUSTRY_CLI_UNSUPPORTED_EXPORT_RESOURCE',
    status: 400
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const DASHBOARD_BUNDLE_FORMATS: DashboardBundleFormat[] = [
  'png',
  'jpg',
  'webp',
  'svg',
  'web-component',
  'excel',
  'pdf',
  'word',
  'ppt'
];
const DASHBOARD_BUNDLE_FORMAT_SET = new Set<string>(DASHBOARD_BUNDLE_FORMATS);
const VISUALIZATION_BUNDLE_FORMATS: VisualizationBundleFormat[] = DASHBOARD_BUNDLE_FORMATS;
const VISUALIZATION_BUNDLE_FORMAT_SET = new Set<string>(VISUALIZATION_BUNDLE_FORMATS);
const DEFAULT_EXPORT_COLORS = ['#5DBE6E', '#4C8BF5', '#F0AC40', '#D73D6C', '#1D7A8A', '#B65911', '#84BA5B'];
const DEFAULT_EXPORT_WIDTH = 557;
const DEFAULT_EXPORT_HEIGHT = 320;

const normalizeChartPayloads = (value: unknown): IllustryChartPayload[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is IllustryChartPayload => isRecord(item) && isRecord(item.option));
  }
  if (isRecord(value)) {
    if (Array.isArray(value.charts)) {
      return normalizeChartPayloads(value.charts);
    }
    if (isRecord(value.option)) {
      return [{
        title: typeof value.title === 'string' ? value.title : undefined,
        option: value.option
      }];
    }
  }
  return [];
};

const parseDashboardBundleFormats = (value?: string): DashboardBundleFormat[] => {
  const rawFormats = (value || 'png')
    .split(',')
    .map((format) => format.trim())
    .filter(Boolean);
  const invalidFormats = rawFormats.filter((format) => !DASHBOARD_BUNDLE_FORMAT_SET.has(format));
  if (invalidFormats.length > 0) {
    throw new IllustryError(`Dashboard exports support ${DASHBOARD_BUNDLE_FORMATS.join(', ')}. Unsupported: ${invalidFormats.join(', ')}.`, {
      code: 'ILLUSTRY_CLI_UNSUPPORTED_DASHBOARD_EXPORT_FORMAT',
      status: 400
    });
  }
  const formats = Array.from(new Set(rawFormats)) as DashboardBundleFormat[];
  if (formats.length === 0) {
    throw new IllustryError('Select at least one dashboard export format.', {
      code: 'ILLUSTRY_CLI_DASHBOARD_EXPORT_EMPTY_SELECTION',
      status: 400
    });
  }
  return formats;
};

const parseVisualizationBundleFormats = (value?: string): VisualizationBundleFormat[] => {
  const rawFormats = (value || 'png')
    .split(',')
    .map((format) => format.trim())
    .filter(Boolean);
  const invalidFormats = rawFormats.filter((format) => !VISUALIZATION_BUNDLE_FORMAT_SET.has(format));
  if (invalidFormats.length > 0) {
    throw new IllustryError(`Visualization exports support ${VISUALIZATION_BUNDLE_FORMATS.join(', ')}. Unsupported: ${invalidFormats.join(', ')}.`, {
      code: 'ILLUSTRY_CLI_UNSUPPORTED_VISUALIZATION_EXPORT_FORMAT',
      status: 400
    });
  }
  const formats = Array.from(new Set(rawFormats)) as VisualizationBundleFormat[];
  if (formats.length === 0) {
    throw new IllustryError('Select at least one visualization export format.', {
      code: 'ILLUSTRY_CLI_VISUALIZATION_EXPORT_EMPTY_SELECTION',
      status: 400
    });
  }
  return formats;
};

const readChartFile = async (filePath: string): Promise<IllustryChartPayload[]> => {
  const parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown;
  const charts = normalizeChartPayloads(parsed);
  if (charts.length === 0) {
    throw new IllustryError('The chart file must contain a chart option or charts array.', {
      code: 'ILLUSTRY_CLI_INVALID_CHART_FILE',
      status: 400
    });
  }
  return charts;
};

const presentString = (value: unknown, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const numberValue = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const stringArray = (value: unknown) => (
  Array.isArray(value)
    ? value.map((item, index) => presentString(item, `Item ${index + 1}`))
    : []
);

const getFirstString = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === 'string');
  }
  return undefined;
};

const getLegendItems = (items: string[]) => {
  const normalized = items.map((item, index) => {
    const label = presentString(item);
    return label || `Series ${index + 1}`;
  });
  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique : ['Series 1'];
};

const getLegendFontSize = (items: string[]) => {
  const maxLength = items.reduce((max, item) => Math.max(max, item.length), 0);
  if (maxLength > 24) return 9;
  if (maxLength > 16) return 10;
  return 11;
};

const getLegendTextWidth = (items: string[]) => {
  const maxLength = items.reduce((max, item) => Math.max(max, item.length), 0);
  if (maxLength > 32) return 88;
  if (maxLength > 20) return 100;
  return 120;
};

const buildLegendOption = (show: boolean, items: string[], top = 0) => {
  const normalizedItems = getLegendItems(items);
  return {
    show,
    type: 'scroll',
    orient: 'horizontal',
    icon: 'roundRect',
    itemWidth: 12,
    itemHeight: 10,
    top,
    left: 'center',
    right: 12,
    itemGap: 10,
    pageIconColor: '#888',
    pageTextStyle: {
      fontSize: 10
    },
    tooltip: {
      show: true
    },
    textStyle: {
      fontSize: getLegendFontSize(normalizedItems),
      width: getLegendTextWidth(normalizedItems),
      overflow: 'truncate',
      ellipsis: '...'
    },
    data: normalizedItems
  };
};

const getChartTopPadding = (showLegend: boolean, hasTitle = false) => {
  const titlePadding = hasTitle ? 40 : 0;
  const legendPadding = showLegend ? 68 : 10;
  return titlePadding + legendPadding;
};

const computeColors = (items: string[]) => getLegendItems(items)
  .reduce<Record<string, string>>((colors, item, index) => {
    colors[item] = DEFAULT_EXPORT_COLORS[index] ?? '#000000';
    return colors;
  }, {});

const withFrontendEChartsOption = (option: Record<string, unknown>) => {
  const toolbox = isRecord(option.toolbox) ? option.toolbox : {};
  const feature = isRecord(toolbox.feature) ? toolbox.feature : {};
  return {
    color: DEFAULT_EXPORT_COLORS,
    ...option,
    toolbox: {
      ...toolbox,
      feature: {
        ...feature,
        restore: isRecord(feature.restore) ? feature.restore : {}
      }
    }
  };
};

const optionWithTitle = (option: Record<string, unknown>, _title: string) => withFrontendEChartsOption(option);

const axisOption = (
  data: Record<string, unknown>,
  chartType: 'bar' | 'line',
  title: string
): Record<string, unknown> | undefined => {
  if (!isRecord(data.values)) return undefined;
  const series = Object.entries(data.values)
    .map(([name, values], index) => ({
      name,
      type: chartType,
      stack: undefined,
      color: DEFAULT_EXPORT_COLORS[index],
      emphasis: {
        focus: 'series'
      },
      data: Array.isArray(values) ? values.map((value) => numberValue(value)) : [numberValue(values)]
    }))
    .filter((item) => item.data.length > 0);
  if (series.length === 0) return undefined;
  const longestSeries = Math.max(...series.map((item) => item.data.length));
  const legendItems = series.map((item) => item.name);
  const headers = stringArray(data.headers);
  const normalizedHeaders = headers.length > 0
    ? headers
    : Array.from({ length: longestSeries }, (_item, index) => `Item ${index + 1}`);
  return optionWithTitle({
    legend: buildLegendOption(true, legendItems),
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    grid: {
      top: getChartTopPadding(true),
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [{
      type: 'category',
      boundaryGap: chartType !== 'line',
      data: normalizedHeaders
    }],
    yAxis: [{
      type: 'value'
    }],
    series
  }, title);
};

type ChartPair = {
  name: string;
  value: number;
};

const pairFromRecord = (record: Record<string, unknown>, index: number): ChartPair => {
  const labelKeys = ['name', 'label', 'category', 'date', 'source', 'title', 'key'];
  const valueKeys = ['value', 'count', 'amount', 'total', 'revenue', 'score', 'y'];
  const name = labelKeys
    .map((key) => presentString(record[key]))
    .find(Boolean)
    || `Item ${index + 1}`;
  const value = valueKeys
    .map((key) => record[key])
    .find((item) => Number.isFinite(Number(String(item ?? '').replace(/,/g, '').trim())));
  if (value !== undefined) {
    return { name, value: numberValue(value, 1) };
  }
  const numericValue = Object.values(record).find((item) => Number.isFinite(Number(String(item ?? '').replace(/,/g, '').trim())));
  return { name, value: numberValue(numericValue, 1) };
};

const pairsFromArray = (items: unknown[]): ChartPair[] => items
  .map((item, index) => {
    if (isRecord(item)) return pairFromRecord(item, index);
    return {
      name: presentString(item, `Item ${index + 1}`),
      value: numberValue(item, 1)
    };
  })
  .filter((pair) => pair.name);

const pairsFromRecordValues = (values: Record<string, unknown>): ChartPair[] => Object.entries(values)
  .map(([name, value]) => ({ name, value: numberValue(value) }))
  .filter((pair) => pair.name);

const pairsFromData = (data: unknown): ChartPair[] => {
  if (Array.isArray(data)) return pairsFromArray(data);
  if (!isRecord(data)) return [];
  if (isRecord(data.values)) return pairsFromRecordValues(data.values);
  if (Array.isArray(data.words)) return pairsFromArray(data.words);
  if (Array.isArray(data.calendar)) return pairsFromArray(data.calendar);
  if (Array.isArray(data.nodes)) return pairsFromArray(data.nodes);
  const numericEntries = Object.entries(data).filter((entry) => Number.isFinite(Number(String(entry[1] ?? '').replace(/,/g, '').trim())));
  return numericEntries.length > 0 ? pairsFromRecordValues(Object.fromEntries(numericEntries)) : [];
};

const pairOption = (
  pairs: ChartPair[],
  chartType: 'bar' | 'line' | 'pie' | 'funnel',
  title: string
): Record<string, unknown> | undefined => {
  if (pairs.length === 0) return undefined;
  if (chartType === 'pie' || chartType === 'funnel') {
    return optionWithTitle({
      tooltip: { trigger: 'item' },
      legend: { top: 44 },
      series: [{
        name: title,
        type: chartType,
        ...(chartType === 'pie' ? { radius: ['35%', '68%'], center: ['50%', '58%'] } : { left: '12%', top: 86, bottom: 24, width: '76%' }),
        data: pairs
      }]
    }, title);
  }
  return optionWithTitle({
    tooltip: { trigger: 'axis' },
    legend: { top: 44 },
    grid: {
      top: 92, right: 28, bottom: 42, left: 54
    },
    xAxis: { type: 'category', data: pairs.map((pair) => pair.name) },
    yAxis: { type: 'value' },
    series: [{ name: title, type: chartType, data: pairs.map((pair) => pair.value) }]
  }, title);
};

const scatterOption = (data: Record<string, unknown>, title: string) => {
  if (!Array.isArray(data.points)) return undefined;
  const points = data.points
    .map((point, index) => {
      if (Array.isArray(point)) return [numberValue(point[0], index + 1), numberValue(point[1])];
      if (isRecord(point) && Array.isArray(point.value)) {
        return [numberValue(point.value[0], index + 1), numberValue(point.value[1])];
      }
      return undefined;
    })
    .filter((point): point is number[] => Array.isArray(point));
  if (points.length === 0) return undefined;
  return optionWithTitle({
    tooltip: { trigger: 'item' },
    grid: {
      top: 72, right: 28, bottom: 42, left: 54
    },
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    series: [{ name: title, type: 'scatter', data: points }]
  }, title);
};

const nodeLinkOption = (data: Record<string, unknown>, type: string, title: string): Record<string, unknown> | undefined => {
  if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) return undefined;
  const links = data.links
    .filter(isRecord)
    .map((link) => ({
      source: presentString(link.source),
      target: presentString(link.target),
      value: numberValue(link.value, 1)
    }))
    .filter((link) => link.source && link.target);
  const nodes = data.nodes
    .filter(isRecord)
    .map((node, index) => ({
      name: presentString(node.name, `Node ${index + 1}`),
      category: presentString(node.category, `Group ${index % DEFAULT_EXPORT_COLORS.length + 1}`)
    }));
  const nodeNames = new Set(nodes.map((node) => node.name));
  links.forEach((link) => {
    if (!nodeNames.has(link.source)) nodes.push({ name: link.source, category: 'Linked' });
    if (!nodeNames.has(link.target)) nodes.push({ name: link.target, category: 'Linked' });
  });
  if (nodes.length === 0 || links.length === 0) return undefined;
  if (type === 'matrix') {
    const xNames = Array.from(new Set(links.map((link) => link.source)));
    const yNames = Array.from(new Set(links.map((link) => link.target)));
    return optionWithTitle({
      tooltip: { trigger: 'item' },
      grid: {
        top: 72, right: 28, bottom: 48, left: 72
      },
      xAxis: { type: 'category', data: xNames },
      yAxis: { type: 'category', data: yNames },
      visualMap: {
        min: 0,
        max: Math.max(1, ...links.map((link) => link.value)),
        orient: 'horizontal',
        left: 'center',
        bottom: 8
      },
      series: [{
        type: 'heatmap',
        data: links.map((link) => [xNames.indexOf(link.source), yNames.indexOf(link.target), link.value])
      }]
    }, title);
  }
  const sankey = type === 'sankey';
  return optionWithTitle({
    tooltip: { trigger: 'item' },
    legend: { top: 44 },
    series: [{
      type: sankey ? 'sankey' : 'graph',
      layout: sankey ? undefined : 'force',
      roam: !sankey,
      top: 82,
      bottom: 24,
      data: nodes,
      nodes,
      links,
      edges: links,
      categories: Array.from(new Set(nodes.map((node) => node.category))).map((name) => ({ name })),
      emphasis: { focus: 'adjacency' },
      force: { repulsion: 120, edgeLength: 70 }
    }]
  }, title);
};

const hierarchyOption = (data: Record<string, unknown>, type: 'treemap' | 'sunburst', title: string) => {
  if (!Array.isArray(data.nodes)) return undefined;
  const normalizeNode = (node: unknown, index: number): Record<string, unknown> => {
    if (!isRecord(node)) {
      return { name: presentString(node, `Item ${index + 1}`), value: 1 };
    }
    return {
      ...node,
      name: presentString(node.name, `Item ${index + 1}`),
      value: numberValue(node.value, 1),
      children: Array.isArray(node.children)
        ? node.children.map((child, childIndex) => normalizeNode(child, childIndex))
        : undefined
    };
  };
  const nodes = data.nodes.map(normalizeNode);
  if (nodes.length === 0) return undefined;
  return optionWithTitle({
    tooltip: { trigger: 'item' },
    series: [{
      type,
      top: 72,
      bottom: 16,
      radius: type === 'sunburst' ? '85%' : undefined,
      data: nodes
    }]
  }, title);
};

const calendarOption = (data: Record<string, unknown>, title: string) => {
  if (!Array.isArray(data.calendar)) return undefined;
  const entries = data.calendar
    .filter(isRecord)
    .map((entry, index) => ({
      date: presentString(entry.date, new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10)),
      value: numberValue(entry.value, 1),
      category: presentString(entry.category),
      properties: entry.properties
    }));
  if (entries.length === 0) return undefined;
  const categories = stringArray(data.categories);
  const derivedCategories = Array.from(new Set(
    entries
      .map((entry) => entry.category)
      .filter((category) => category.length > 0)
  ));
  const legendItems = getLegendItems(categories.length > 0 ? categories : derivedCategories);
  const categoryColors = computeColors(legendItems);
  const years = Array.from(new Set(
    entries
      .map((entry) => new Date(entry.date).getFullYear())
      .filter((year) => !Number.isNaN(year))
  )).sort((a, b) => a - b);
  const normalizedYears = years.length > 0 ? years : [new Date().getFullYear()];
  const chartTop = getChartTopPadding(true);
  const textColor = '#333';
  const calendar = normalizedYears.map((year, index) => ({
    top: chartTop + (index * 200),
    left: 30,
    right: 30,
    cellSize: ['auto', 16],
    range: String(year),
    itemStyle: {
      borderWidth: 0.5
    },
    orient: 'horizontal',
    dayLabel: {
      show: true,
      fontSize: 14,
      color: textColor
    },
    monthLabel: {
      show: true,
      fontSize: 14,
      color: textColor
    },
    yearLabel: {
      show: true,
      fontSize: 14,
      position: 'top',
      color: textColor
    }
  }));
  const series = normalizedYears.flatMap((year, calendarIndex) => {
    const entriesForYear = entries.filter((entry) => {
      const entryYear = new Date(entry.date).getFullYear();
      return !Number.isNaN(entryYear) && entryYear === year;
    });
    return legendItems.map((legendItem) => {
      const isFallbackLegend = legendItems.length === 1 && legendItems[0] === 'Series 1';
      const categoryData = entriesForYear
        .filter((entry) => entry.category === legendItem)
        .map((entry) => [entry.date, entry.value, entry.category]);
      const fallbackData = entriesForYear.map((entry) => [entry.date, entry.value, entry.category]);
      return {
        name: legendItem,
        type: 'heatmap',
        coordinateSystem: 'calendar',
        calendarIndex,
        data: isFallbackLegend ? fallbackData : categoryData,
        itemStyle: {
          color: categoryColors[legendItem]
        }
      };
    });
  });
  return optionWithTitle({
    legend: buildLegendOption(true, legendItems),
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    visualMap: {
      show: false,
      orient: 'horizontal',
      left: 'center',
      top: chartTop + 4,
      type: 'piecewise',
      categories: legendItems,
      textStyle: {
        color: textColor
      },
      inRange: {
        color: categoryColors
      }
    },
    calendar,
    series
  }, title);
};

const getVisualizationTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'line-chart': 'Line Chart',
    'bar-chart': 'Bar Chart',
    'pie-chart': 'Pie Chart',
    calendar: 'Calendar',
    scatter: 'Scatter',
    treemap: 'Treemap',
    sunburst: 'Sunburst',
    funnel: 'Funnel',
    timeline: 'Timeline',
    'word-cloud': 'Word Cloud',
    'force-directed-graph': 'Forced Layout Graph',
    'hierarchical-edge-bundling': 'Hierarchical Edge Bundling',
    sankey: 'Sankey',
    matrix: 'Matrix'
  };
  return labels[type] || type;
};

const getDashboardVisualizationTitle = (name: string, type: string) => `${name} (${getVisualizationTypeLabel(type)})`;

const timelineOption = (data: Record<string, unknown>, title: string) => {
  const pairs = Object.entries(data)
    .filter((entry) => isRecord(entry[1]))
    .map(([date, value]) => {
      const record = value as Record<string, unknown>;
      const events = Array.isArray(record.events) ? record.events.length : 1;
      return { name: date, value: events };
    });
  return pairOption(pairs, 'bar', title);
};

const dashboardOptionFromData = (data: unknown, type: string, title: string): Record<string, unknown> | undefined => {
  if (isRecord(data) && Array.isArray(data.series)) {
    return optionWithTitle(data, title);
  }
  if (!isRecord(data)) {
    return pairOption(pairsFromData(data), 'bar', title);
  }
  if (type === 'line-chart') return axisOption(data, 'line', title) || pairOption(pairsFromData(data), 'line', title);
  if (type === 'bar-chart') return axisOption(data, 'bar', title) || pairOption(pairsFromData(data), 'bar', title);
  if (type === 'pie-chart') return pairOption(pairsFromData(data), 'pie', title);
  if (type === 'funnel') return pairOption(pairsFromData(data), 'funnel', title);
  if (type === 'scatter') return scatterOption(data, title) || pairOption(pairsFromData(data), 'bar', title);
  if (type === 'force-directed-graph' || type === 'hierarchical-edge-bundling' || type === 'sankey' || type === 'matrix') {
    return nodeLinkOption(data, type, title) || pairOption(pairsFromData(data), 'bar', title);
  }
  if (type === 'treemap' || type === 'sunburst') {
    return hierarchyOption(data, type, title) || pairOption(pairsFromData(data), type === 'treemap' ? 'bar' : 'pie', title);
  }
  if (type === 'calendar') return calendarOption(data, title) || pairOption(pairsFromData(data), 'bar', title);
  if (type === 'timeline') return timelineOption(data, title) || pairOption(pairsFromData(data), 'bar', title);
  return axisOption(data, 'bar', title) || pairOption(pairsFromData(data), 'bar', title);
};

const extractDashboardVisualizations = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  if (Array.isArray(value.visualizations)) return value.visualizations.filter(isRecord);
  const fromDashboard = extractDashboardVisualizations(value.dashboard);
  if (fromDashboard.length > 0) return fromDashboard;
  return extractDashboardVisualizations(value.data);
};

const createDashboardChartPayloads = (dashboard: unknown): IllustryChartPayload[] => {
  const visualizations = extractDashboardVisualizations(dashboard);
  const charts = visualizations.flatMap((visualization, index) => {
    const type = getFirstString(visualization.type) || 'bar-chart';
    const title = getDashboardVisualizationTitle(
      presentString(visualization.name, `Visualization ${index + 1}`),
      type
    );
    const embeddedCharts = normalizeChartPayloads(visualization.charts || visualization.data)
      .map((chart) => ({
        ...chart,
        title: chart.title || title,
        width: chart.width || DEFAULT_EXPORT_WIDTH,
        height: chart.height || DEFAULT_EXPORT_HEIGHT
      }));
    if (embeddedCharts.length > 0) return embeddedCharts;
    const option = dashboardOptionFromData(visualization.data, type, title);
    return option
      ? [{
        title,
        option: option as IllustryChartPayload['option'],
        width: DEFAULT_EXPORT_WIDTH,
        height: DEFAULT_EXPORT_HEIGHT
      }]
      : [];
  });
  return charts.length > 0 ? charts : normalizeChartPayloads(dashboard);
};

const createVisualizationChartPayloads = (
  visualization: unknown,
  fallbackName: string,
  fallbackType?: string
): IllustryChartPayload[] => {
  const record = isRecord(visualization) ? visualization : {};
  const type = getFirstString(record.type) || fallbackType || 'bar-chart';
  const title = getDashboardVisualizationTitle(
    presentString(record.name, fallbackName),
    type
  );
  const embeddedCharts = normalizeChartPayloads(record.charts || record.data)
    .map((chart) => ({
      ...chart,
      title: chart.title || title,
      width: chart.width || DEFAULT_EXPORT_WIDTH,
      height: chart.height || DEFAULT_EXPORT_HEIGHT
    }));
  if (embeddedCharts.length > 0) {
    return embeddedCharts;
  }
  const option = dashboardOptionFromData(record.data || visualization, type, title);
  return option
    ? [{
      title,
      option: option as IllustryChartPayload['option'],
      width: DEFAULT_EXPORT_WIDTH,
      height: DEFAULT_EXPORT_HEIGHT
    }]
    : [];
};

type ExportClient = Awaited<ReturnType<CliContext['client']>>;

const loadDashboardExportCharts = async (
  client: ExportClient,
  name: string,
  chartFile?: string
) => {
  if (chartFile) {
    return {
      dashboard: undefined,
      charts: await readChartFile(chartFile)
    };
  }
  const dashboard = await client.findDashboard(name, true);
  const charts = createDashboardChartPayloads(dashboard);
  if (charts.length === 0) {
    throw new IllustryError(`Dashboard "${name}" has no exportable visualizations. Add visualizations to the dashboard and try again.`, {
      code: 'ILLUSTRY_CLI_DASHBOARD_EXPORT_MISSING_VISUALIZATIONS',
      status: 400
    });
  }
  return {
    dashboard,
    charts
  };
};

const loadVisualizationExportCharts = async (
  client: ExportClient,
  name: string,
  type?: string,
  chartFile?: string
) => {
  if (chartFile) {
    return {
      visualization: undefined,
      charts: await readChartFile(chartFile)
    };
  }
  const visualization = await client.findVisualization(name, type);
  const charts = createVisualizationChartPayloads(visualization, name, type);
  if (charts.length === 0) {
    throw new IllustryError(`Visualization "${name}" has no exportable chart data. Import or update the visualization with data and try again.`, {
      code: 'ILLUSTRY_CLI_VISUALIZATION_EXPORT_MISSING_DATA',
      status: 400
    });
  }
  return {
    visualization,
    charts
  };
};

const writeDashboardExportFile = async (
  context: CliContext,
  file: { filename: string; buffer: Buffer },
  output?: string
) => {
  const store = await context.store();
  if (!output) return store.writeExportFile(file);
  const target = path.resolve(output);
  try {
    const stat = await fs.stat(target);
    if (stat.isDirectory()) {
      return store.writeExportFile(file, output);
    }
  } catch (error) {
    const code = isRecord(error) && typeof error.code === 'string' ? error.code : undefined;
    if (code !== 'ENOENT') throw error;
  }
  if (!path.extname(target)) {
    return store.writeExportFile(file, output);
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, file.buffer);
  return target;
};

const getDashboardExportTitle = (name: string, title?: string) => title || `dashboard-${name}`;

const normalizeImportMapping = (options: ImportOptions): ImportColumnMapping | undefined => {
  const parsed = typeof options.mapping === 'string'
    ? parseImportMapping(options.mapping)
    : options.mapping || {};
  const mapping = {
    ...parsed,
    label: options.labelColumn || parsed.label,
    value: options.valueColumn || parsed.value
  };
  return mapping.label || mapping.value ? mapping : undefined;
};

const normalizeFrontendFileType = (value: string): FrontendFileType => {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'JSON' || normalized === 'CSV' || normalized === 'EXCEL' || normalized === 'XML') {
    return normalized;
  }
  if (normalized === 'XLSX') return 'EXCEL';
  throw new IllustryError('Choose file type JSON, CSV, EXCEL, or XML.', {
    code: 'ILLUSTRY_CLI_IMPORT_FILE_TYPE_INVALID',
    status: 400
  });
};

const detectFrontendFileType = (filePath: string): FrontendFileType => {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.json') return 'JSON';
  if (extension === '.csv') return 'CSV';
  if (extension === '.xlsx') return 'EXCEL';
  if (extension === '.xml') return 'XML';
  throw new IllustryError(`Unsupported visualization source file: ${extension || 'unknown'}.`, {
    code: 'ILLUSTRY_UNSUPPORTED_SOURCE_FORMAT',
    status: 400
  });
};

const simpleMappingToFrontendMapping = (
  mapping: ImportColumnMapping | undefined,
  type?: string
) => {
  if (!mapping?.label && !mapping?.value) return undefined;
  if (type === 'bar-chart' || type === 'line-chart' || !type) {
    return {
      headers: mapping.label,
      data: mapping.value
    };
  }
  return {
    names: mapping.label,
    values: mapping.value
  };
};

const normalizeFrontendFileDetails = (
  options: ImportOptions,
  filePath: string,
  fallbackMapping?: ImportColumnMapping
) => {
  const fileType = options.fileType ? normalizeFrontendFileType(options.fileType) : detectFrontendFileType(filePath);
  const mapping = options.frontendMapping && Object.keys(options.frontendMapping).length > 0
    ? options.frontendMapping
    : simpleMappingToFrontendMapping(fallbackMapping, options.type);
  return {
    fileType,
    includeHeaders: options.includeHeaders,
    mapping,
    sheets: options.sheets,
    separator: options.separator
  };
};

const importVisualization = async (context: CliContext, options: ImportOptions) => {
  if (!options.file) {
    throw new IllustryError('Missing file path. Use `illustry import <file>` or `--file <path>`.', {
      code: 'ILLUSTRY_CLI_MISSING_FILE',
      status: 400
    });
  }

  const profile = await context.profile();
  const fileType = options.fileType ? normalizeFrontendFileType(options.fileType) : detectFrontendFileType(options.file);
  if (options.fullDetails === true && fileType !== 'JSON') {
    throw new IllustryError('All-details import is only supported for JSON files.', {
      code: 'ILLUSTRY_CLI_IMPORT_FULL_DETAILS_JSON_ONLY',
      status: 400
    });
  }
  const mapping = normalizeImportMapping(options);
  if (profile.mode === 'live') {
    const client = await context.client();
    const result = await client.uploadVisualizationSource({
      filePath: options.file,
      visualizationDetails: {
        name: options.name,
        type: options.type || 'bar-chart',
        description: options.description,
        tags: options.tags
      },
      fileDetails: normalizeFrontendFileDetails({ ...options, fileType }, options.file, mapping),
      fullDetails: options.fullDetails === true
    });
    await context.saveClientSession(client.getSessionSnapshot());
    return result;
  }

  const asset = await importVisualizationSource({
    filePath: options.file,
    name: options.name,
    type: options.type || 'bar-chart',
    mapping
  });
  const store = await context.store();
  return store.saveAsset(asset);
};

const listResources = async (context: CliContext, options: ListOptions) => {
  const profile = await context.profile();
  const resource = normalizeListResource(options.resource);
  if (profile.mode === 'live' && resource !== 'assets') {
    const client = await context.client();
    const data = await client.browse({
      resource: normalizeServerResource(resource),
      query: {
        text: options.text,
        page: options.page,
        sort: options.sort,
        sharedScope: options.sharedScope
      }
    });
    await context.saveClientSession(client.getSessionSnapshot());
    return {
      mode: 'live',
      server: profile.serverUrl,
      resource,
      data
    };
  }
  const store = await context.store();
  return {
    mode: 'offline',
    workspace: store.rootDir,
    resource: 'assets',
    data: await store.readAssets()
  };
};

const exportAsset = async (context: CliContext, options: ExportOptions) => {
  const assetName = options.asset;
  if (!assetName) {
    throw new IllustryError('Missing --asset for export.', {
      code: 'ILLUSTRY_CLI_MISSING_ASSET',
      status: 400
    });
  }
  const profile = await context.profile();
  const store = await context.store();
  const resource = normalizeExportResource(options.resource);
  const formats = resource === 'dashboard'
    ? parseDashboardBundleFormats(options.format)
    : profile.mode === 'live'
      ? parseVisualizationBundleFormats(options.format)
      : parseExportFormats(options.format);

  if (profile.mode === 'live') {
    const client = await context.client();
    const charts = resource === 'dashboard'
      ? (await loadDashboardExportCharts(client, assetName, options.chartFile)).charts
      : (await loadVisualizationExportCharts(client, assetName, options.type, options.chartFile)).charts;
    const exported = await client.downloadExport({
      resource,
      name: assetName,
      body: {
        name: assetName,
        type: options.type,
        formats,
        charts,
        title: resource === 'dashboard' ? getDashboardExportTitle(assetName, options.title) : options.title || assetName
      }
    });
    await context.saveClientSession(client.getSessionSnapshot());
    const filePath = await store.writeExportFile(exported, options.out);
    return {
      mode: 'live',
      filePath,
      filename: exported.filename,
      mimeType: exported.mimeType,
      bundled: exported.mimeType === 'application/zip'
    };
  }

  const asset = await store.requireAsset(assetName);
  const bundle = await createLocalExportBundle({ asset, formats });
  const filePath = await store.writeExportFile(bundle, options.out);
  return {
    mode: 'offline',
    filePath,
    filename: bundle.filename,
    mimeType: bundle.mimeType,
    bundled: bundle.bundled
  };
};

const cleanVisualizationQuery = (options: VisualizationQueryOptions) => {
  const query: Record<string, string> = {};
  if (options.name?.trim()) query.name = options.name.trim();
  if (options.text?.trim()) query.text = options.text.trim();
  if (options.page?.trim()) query.page = options.page.trim();
  if (options.sort?.trim()) query.sort = options.sort.trim();
  if (options.perPage?.trim()) query.per_page = options.perPage.trim();
  if (options.sharedScope?.trim()) query.sharedScope = options.sharedScope.trim();
  return query;
};

const listVisualizations = async (context: CliContext, options: VisualizationQueryOptions = {}) => {
  const client = await context.client();
  const profile = await context.profile();
  const data = await client.browse({
    resource: 'visualizations',
    query: cleanVisualizationQuery(options)
  });
  await context.saveClientSession(client.getSessionSnapshot());
  return {
    mode: 'live',
    server: profile.serverUrl,
    resource: 'visualizations',
    data
  };
};

const getVisualization = async (context: CliContext, options: VisualizationIdentityOptions) => {
  if (!options.name) {
    throw new IllustryError('Missing visualization name.', {
      code: 'ILLUSTRY_CLI_MISSING_VISUALIZATION_NAME',
      status: 400
    });
  }
  const client = await context.client();
  const result = await client.findVisualization(options.name, options.type);
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

const removeVisualization = async (context: CliContext, options: VisualizationIdentityOptions) => {
  if (!options.name) {
    throw new IllustryError('Missing visualization name.', {
      code: 'ILLUSTRY_CLI_MISSING_VISUALIZATION_NAME',
      status: 400
    });
  }
  const client = await context.client();
  await client.findVisualization(options.name, options.type);
  const result = await client.deleteVisualization({
    name: options.name,
    type: options.type
  });
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

const exportVisualization = async (context: CliContext, options: VisualizationExportOptions) => {
  if (!options.name) {
    throw new IllustryError('Missing visualization name.', {
      code: 'ILLUSTRY_CLI_MISSING_VISUALIZATION_NAME',
      status: 400
    });
  }
  const client = await context.client();
  const formats = parseVisualizationBundleFormats(options.format);
  const { visualization, charts } = await loadVisualizationExportCharts(client, options.name, options.type, options.chartFile);
  const resolvedType = options.type || (isRecord(visualization) ? getFirstString(visualization.type) : undefined);
  const exported = await client.downloadExport({
    resource: 'visualization',
    name: options.name,
    body: {
      name: options.name,
      type: resolvedType,
      formats,
      charts,
      title: options.title || options.name
    }
  });
  await context.saveClientSession(client.getSessionSnapshot());
  const filePath = await writeDashboardExportFile(context, exported, options.out);
  return {
    mode: 'live',
    filePath,
    filename: exported.filename,
    mimeType: exported.mimeType,
    bundled: exported.mimeType === 'application/zip'
  };
};

const deleteResource = async (context: CliContext, options: DeleteOptions) => {
  const name = options.name;
  if (!name) {
    throw new IllustryError('Missing resource name.', {
      code: 'ILLUSTRY_CLI_MISSING_RESOURCE_NAME',
      status: 400
    });
  }
  const profile = await context.profile();
  const resource = normalizeListResource(options.resource);
  if (profile.mode === 'live' && resource !== 'assets') {
    const client = await context.client();
    let result: unknown;
    if (resource === 'projects') {
      result = await client.deleteProject(name);
    } else if (resource === 'dashboards') {
      result = await client.deleteDashboard(name);
    } else {
      result = await client.deleteVisualization({ name, type: options.type });
    }
    await context.saveClientSession(client.getSessionSnapshot());
    return result;
  }
  const store = await context.store();
  const deleted = await store.deleteAsset(name);
  if (!deleted) {
    throw new IllustryError(`Illustry asset "${name}" was not found.`, {
      code: 'ILLUSTRY_ASSET_NOT_FOUND',
      status: 404
    });
  }
  return { ok: true, deleted: name };
};

const createProject = async (context: CliContext, options: ProjectMutationOptions) => {
  if (!options.name) {
    throw new IllustryError('Missing project name.', {
      code: 'ILLUSTRY_CLI_MISSING_PROJECT_NAME',
      status: 400
    });
  }
  const client = await context.client();
  const result = await client.createProject({
    projectName: options.name,
    projectDescription: options.description,
    isActive: options.active
  });
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

const updateProject = async (context: CliContext, options: ProjectMutationOptions) => {
  if (!options.name) {
    throw new IllustryError('Missing project name.', {
      code: 'ILLUSTRY_CLI_MISSING_PROJECT_NAME',
      status: 400
    });
  }
  const client = await context.client();
  await client.findProject(options.name);
  const result = await client.updateProject({
    name: options.name,
    description: options.description,
    isActive: options.active
  });
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

const getProject = async (context: CliContext, name?: string) => {
  if (!name) {
    throw new IllustryError('Missing project name.', {
      code: 'ILLUSTRY_CLI_MISSING_PROJECT_NAME',
      status: 400
    });
  }
  const client = await context.client();
  const result = await client.findProject(name);
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

const cleanProjectQuery = (options: ProjectQueryOptions) => {
  const query: Record<string, string> = {};
  if (options.name?.trim()) query.name = options.name.trim();
  if (options.text?.trim()) query.text = options.text.trim();
  if (options.page?.trim()) query.page = options.page.trim();
  if (options.sort?.trim()) query.sort = options.sort.trim();
  if (options.perPage?.trim()) query.per_page = options.perPage.trim();
  return query;
};

const cleanDashboardQuery = (options: DashboardQueryOptions) => {
  const query: Record<string, string> = {};
  if (options.name?.trim()) query.name = options.name.trim();
  if (options.text?.trim()) query.text = options.text.trim();
  if (options.page?.trim()) query.page = options.page.trim();
  if (options.sort?.trim()) query.sort = options.sort.trim();
  if (options.perPage?.trim()) query.per_page = options.perPage.trim();
  return query;
};

const listProjects = async (context: CliContext, options: ProjectQueryOptions = {}) => {
  const client = await context.client();
  const profile = await context.profile();
  const data = await client.browse({
    resource: 'projects',
    query: cleanProjectQuery(options)
  });
  await context.saveClientSession(client.getSessionSnapshot());
  return {
    mode: 'live',
    server: profile.serverUrl,
    resource: 'projects',
    data
  };
};

const createDashboard = async (context: CliContext, options: DashboardMutationOptions) => {
  if (!options.name) {
    throw new IllustryError('Missing dashboard name.', {
      code: 'ILLUSTRY_CLI_MISSING_DASHBOARD_NAME',
      status: 400
    });
  }
  const client = await context.client();
  const result = await client.createDashboard({
    name: options.name,
    description: options.description,
    visualizations: options.visualizations
  });
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

const updateDashboard = async (context: CliContext, options: DashboardMutationOptions) => {
  if (!options.name) {
    throw new IllustryError('Missing dashboard name.', {
      code: 'ILLUSTRY_CLI_MISSING_DASHBOARD_NAME',
      status: 400
    });
  }
  const client = await context.client();
  await client.findDashboard(options.name, true);
  const result = await client.updateDashboard({
    name: options.name,
    description: options.description,
    visualizations: options.visualizations
  });
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

const getDashboard = async (context: CliContext, name?: string) => {
  if (!name) {
    throw new IllustryError('Missing dashboard name.', {
      code: 'ILLUSTRY_CLI_MISSING_DASHBOARD_NAME',
      status: 400
    });
  }
  const client = await context.client();
  const result = await client.findDashboard(name, true);
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

const listDashboards = async (context: CliContext, options: DashboardQueryOptions = {}) => {
  const client = await context.client();
  const profile = await context.profile();
  const data = await client.browse({
    resource: 'dashboards',
    query: cleanDashboardQuery(options)
  });
  await context.saveClientSession(client.getSessionSnapshot());
  return {
    mode: 'live',
    server: profile.serverUrl,
    resource: 'dashboards',
    data
  };
};

const removeDashboard = async (context: CliContext, name?: string) => {
  if (!name) {
    throw new IllustryError('Missing dashboard name.', {
      code: 'ILLUSTRY_CLI_MISSING_DASHBOARD_NAME',
      status: 400
    });
  }
  const client = await context.client();
  await client.findDashboard(name, true);
  const result = await client.deleteDashboard(name);
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

const exportDashboard = async (context: CliContext, options: DashboardExportOptions) => {
  if (!options.name) {
    throw new IllustryError('Missing dashboard name.', {
      code: 'ILLUSTRY_CLI_MISSING_DASHBOARD_NAME',
      status: 400
    });
  }
  const client = await context.client();
  const formats = parseDashboardBundleFormats(options.format);
  const { charts } = await loadDashboardExportCharts(client, options.name, options.chartFile);
  const exported = await client.downloadExport({
    resource: 'dashboard',
    name: options.name,
    body: {
      name: options.name,
      formats,
      charts,
      title: getDashboardExportTitle(options.name, options.title)
    }
  });
  await context.saveClientSession(client.getSessionSnapshot());
  const filePath = await writeDashboardExportFile(context, exported, options.out);
  return {
    mode: 'live',
    filePath,
    filename: exported.filename,
    mimeType: exported.mimeType,
    bundled: exported.mimeType === 'application/zip'
  };
};

const removeProject = async (context: CliContext, name?: string) => {
  if (!name) {
    throw new IllustryError('Missing project name.', {
      code: 'ILLUSTRY_CLI_MISSING_PROJECT_NAME',
      status: 400
    });
  }
  const client = await context.client();
  await client.findProject(name);
  const result = await client.deleteProject(name);
  await context.saveClientSession(client.getSessionSnapshot());
  return result;
};

export {
  createDashboard,
  createProject,
  deleteResource,
  exportAsset,
  exportDashboard,
  exportVisualization,
  getDashboard,
  getProject,
  getVisualization,
  importVisualization,
  listDashboards,
  listProjects,
  listResources,
  listVisualizations,
  normalizeImportMapping,
  normalizeExportResource,
  normalizeListResource,
  removeDashboard,
  removeProject,
  removeVisualization,
  updateDashboard,
  updateProject
};
export type {
  DashboardExportOptions,
  DashboardMutationOptions,
  DashboardQueryOptions,
  DeleteOptions,
  ExportOptions,
  ImportOptions,
  ListOptions,
  VisualizationExportOptions,
  VisualizationIdentityOptions,
  VisualizationQueryOptions,
  ProjectMutationOptions,
  ProjectQueryOptions
};
