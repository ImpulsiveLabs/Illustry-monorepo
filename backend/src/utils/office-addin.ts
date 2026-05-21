import { VisualizationTypes } from '@illustry/types';

type OfficeRangePayload = {
  type?: string;
  title?: string;
  values?: unknown[][];
  formulas?: unknown[][];
};

type OfficePreviewResult = {
  title: string;
  type: VisualizationTypes.VisualizationTypesEnum;
  data: VisualizationTypes.VisualizationDataData;
  option: Record<string, unknown>;
};

const DEFAULT_COLORS = ['#5DBE6E', '#4C8BF5', '#F0AC40', '#D73D6C', '#1D7A8A', '#B65911', '#84BA5B'];

const SUPPORTED_TYPES = new Set<string>([
  VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
  VisualizationTypes.VisualizationTypesEnum.LINE_CHART,
  VisualizationTypes.VisualizationTypesEnum.PIE_CHART,
  VisualizationTypes.VisualizationTypesEnum.FUNNEL,
  VisualizationTypes.VisualizationTypesEnum.SCATTER,
  VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD,
  VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH,
  VisualizationTypes.VisualizationTypesEnum.SANKEY,
  VisualizationTypes.VisualizationTypesEnum.CALENDAR,
  VisualizationTypes.VisualizationTypesEnum.MATRIX
]);

const normalizeType = (value: unknown): VisualizationTypes.VisualizationTypesEnum => (
  typeof value === 'string' && SUPPORTED_TYPES.has(value)
    ? value as VisualizationTypes.VisualizationTypesEnum
    : VisualizationTypes.VisualizationTypesEnum.BAR_CHART
);

const isPresent = (value: unknown) => value !== null && value !== undefined && String(value).trim() !== '';

const toStringValue = (value: unknown, fallback = '') => {
  if (!isPresent(value)) {
    return fallback;
  }
  return String(value).trim();
};

const toNumberValue = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  const numberValue = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeRows = (values: unknown): unknown[][] => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => row.map((cell) => (cell === undefined ? null : cell)))
    .filter((row) => row.some(isPresent));
};

const getRowsWithoutHeader = (rows: unknown[][]) => rows.length > 1 ? rows.slice(1) : rows;

const getHeaderLabel = (value: unknown, index: number) => {
  const label = toStringValue(value);
  return label || `Series ${index}`;
};

const buildAxisData = (rows: unknown[][]): VisualizationTypes.AxisChartData => {
  const headerRow = rows[0] || [];
  const dataRows = getRowsWithoutHeader(rows);
  const seriesCount = Math.max(1, Math.max(...rows.map((row) => row.length), 2) - 1);
  const headers = dataRows.map((row, index) => toStringValue(row[0], `Row ${index + 1}`));
  const values = Array.from({ length: seriesCount }).reduce<Record<string, number[]>>((seriesMap, _item, index) => {
    const seriesName = getHeaderLabel(headerRow[index + 1], index + 1);
    seriesMap[seriesName] = dataRows.map((row) => toNumberValue(row[index + 1]));
    return seriesMap;
  }, {});

  return { headers, values };
};

const buildKeyValueData = (rows: unknown[][]): Record<string, number> => (
  getRowsWithoutHeader(rows).reduce<Record<string, number>>((values, row, index) => {
    const label = toStringValue(row[0], `Item ${index + 1}`);
    values[label] = toNumberValue(row[1]);
    return values;
  }, {})
);

const buildScatterData = (rows: unknown[][]): VisualizationTypes.ScatterData => ({
  points: getRowsWithoutHeader(rows).map((row, index) => ({
    value: [toNumberValue(row[0], index + 1), toNumberValue(row[1])],
    category: toStringValue(row[2], 'Series 1')
  }))
});

const buildWordCloudData = (rows: unknown[][]): VisualizationTypes.WordCloudData => ({
  words: getRowsWithoutHeader(rows).map((row, index) => ({
    name: toStringValue(row[0], `Word ${index + 1}`),
    value: toNumberValue(row[1], 1)
  }))
});

const buildCalendarData = (rows: unknown[][]): VisualizationTypes.CalendarData => ({
  calendar: getRowsWithoutHeader(rows).map((row, index) => ({
    date: toStringValue(row[0], new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10)),
    category: toStringValue(row[1], 'Value'),
    value: toNumberValue(row[2] ?? row[1], 1)
  }))
});

const buildNodeLinkData = (rows: unknown[][]): VisualizationTypes.NodeLinkData => {
  const links = getRowsWithoutHeader(rows)
    .map((row) => ({
      source: toStringValue(row[0]),
      target: toStringValue(row[1]),
      value: toNumberValue(row[2], 1)
    }))
    .filter((link) => link.source && link.target);
  const names = Array.from(new Set(links.flatMap((link) => [link.source, link.target])));

  return {
    nodes: names.map((name, index) => ({ name, category: `Group ${index % DEFAULT_COLORS.length + 1}` })),
    links
  };
};

const buildMatrixData = (rows: unknown[][]): VisualizationTypes.NodeLinkData => {
  const links = getRowsWithoutHeader(rows)
    .map((row) => ({
      source: toStringValue(row[0]),
      target: toStringValue(row[1]),
      value: toNumberValue(row[2], 1)
    }))
    .filter((link) => link.source && link.target);
  const names = Array.from(new Set(links.flatMap((link) => [link.source, link.target])));

  return {
    nodes: names.map((name, index) => ({ name, category: `Group ${index % DEFAULT_COLORS.length + 1}` })),
    links
  };
};

const optionFromAxisData = (
  data: VisualizationTypes.AxisChartData,
  chartType: 'bar' | 'line',
  title: string
) => ({
  color: DEFAULT_COLORS,
  title: { text: title, left: 'center', top: 8 },
  tooltip: { trigger: 'axis' },
  legend: { top: 44 },
  grid: {
    top: 92, right: 28, bottom: 42, left: 54
  },
  xAxis: { type: 'category', data: data.headers },
  yAxis: { type: 'value' },
  series: Object.entries(data.values).map(([name, values]) => ({ name, type: chartType, data: values }))
});

const optionFromKeyValues = (
  values: Record<string, number>,
  chartType: 'pie' | 'funnel',
  title: string
) => ({
  color: DEFAULT_COLORS,
  title: { text: title, left: 'center', top: 8 },
  tooltip: { trigger: 'item' },
  legend: { top: 44 },
  series: [{
    name: title,
    type: chartType,
    ...(chartType === 'pie' ? { radius: ['35%', '68%'], center: ['50%', '58%'] } : { left: '12%', top: 86, bottom: 24, width: '76%' }),
    data: Object.entries(values).map(([name, value]) => ({ name, value }))
  }]
});

const optionFromScatter = (data: VisualizationTypes.ScatterData, title: string) => ({
  color: DEFAULT_COLORS,
  title: { text: title, left: 'center', top: 8 },
  tooltip: { trigger: 'item' },
  grid: {
    top: 72, right: 28, bottom: 42, left: 54
  },
  xAxis: { type: 'value' },
  yAxis: { type: 'value' },
  series: [{
    type: 'scatter',
    data: data.points.map((point) => point.value)
  }]
});

const optionFromWordCloud = (data: VisualizationTypes.WordCloudData, title: string) => ({
  color: DEFAULT_COLORS,
  title: { text: title, left: 'center', top: 8 },
  tooltip: { trigger: 'item' },
  series: [{
    type: 'wordCloud',
    shape: 'circle',
    width: '92%',
    height: '82%',
    top: 54,
    data: data.words
  }]
});

const optionFromCalendar = (data: VisualizationTypes.CalendarData, title: string) => {
  const dates = data.calendar.map((entry) => entry.date).filter(Boolean).sort();
  const firstYear = dates[0]?.slice(0, 4) || String(new Date().getFullYear());

  return {
    color: DEFAULT_COLORS,
    title: { text: title, left: 'center', top: 8 },
    tooltip: { trigger: 'item' },
    visualMap: {
      min: 0,
      max: Math.max(1, ...data.calendar.map((entry) => entry.value)),
      orient: 'horizontal',
      left: 'center',
      top: 44
    },
    calendar: {
      top: 94,
      left: 38,
      right: 24,
      cellSize: ['auto', 18],
      range: firstYear
    },
    series: [{
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: data.calendar.map((entry) => [entry.date, entry.value])
    }]
  };
};

const optionFromNodeLink = (
  data: VisualizationTypes.NodeLinkData,
  title: string,
  chartType: VisualizationTypes.VisualizationTypesEnum
) => ({
  color: DEFAULT_COLORS,
  title: { text: title, left: 'center', top: 8 },
  tooltip: { trigger: 'item' },
  legend: { top: 44 },
  series: [{
    type: chartType === VisualizationTypes.VisualizationTypesEnum.SANKEY ? 'sankey' : 'graph',
    layout: chartType === VisualizationTypes.VisualizationTypesEnum.SANKEY ? undefined : 'force',
    roam: chartType !== VisualizationTypes.VisualizationTypesEnum.SANKEY,
    top: 82,
    bottom: 24,
    data: data.nodes.map((node) => ({ name: node.name, category: node.category })),
    nodes: data.nodes.map((node) => ({ name: node.name, category: node.category })),
    links: data.links,
    edges: data.links,
    categories: Array.from(new Set(data.nodes.map((node) => node.category))).map((name) => ({ name })),
    emphasis: { focus: 'adjacency' },
    force: { repulsion: 120, edgeLength: 70 }
  }]
});

const optionFromMatrix = (data: VisualizationTypes.NodeLinkData, title: string) => {
  const xNames = Array.from(new Set(data.links.map((link) => link.source)));
  const yNames = Array.from(new Set(data.links.map((link) => link.target)));

  return {
    color: DEFAULT_COLORS,
    title: { text: title, left: 'center', top: 8 },
    tooltip: { trigger: 'item' },
    grid: {
      top: 72, right: 28, bottom: 48, left: 72
    },
    xAxis: { type: 'category', data: xNames },
    yAxis: { type: 'category', data: yNames },
    visualMap: {
      min: 0,
      max: Math.max(1, ...data.links.map((link) => link.value)),
      orient: 'horizontal',
      left: 'center',
      bottom: 8
    },
    series: [{
      type: 'heatmap',
      data: data.links.map((link) => [xNames.indexOf(link.source), yNames.indexOf(link.target), link.value])
    }]
  };
};

const createOfficeVisualizationPreview = (payload: OfficeRangePayload): OfficePreviewResult => {
  const type = normalizeType(payload.type);
  const rows = normalizeRows(payload.values);
  if (rows.length === 0) {
    throw new Error('Select a non-empty Excel range before rendering a visualization.');
  }
  const title = toStringValue(payload.title, 'Illustry Excel visualization');

  switch (type) {
    case VisualizationTypes.VisualizationTypesEnum.LINE_CHART: {
      const data = buildAxisData(rows);
      return {
        title, type, data, option: optionFromAxisData(data, 'line', title)
      };
    }
    case VisualizationTypes.VisualizationTypesEnum.PIE_CHART: {
      const data = { values: buildKeyValueData(rows) };
      return {
        title, type, data, option: optionFromKeyValues(data.values, 'pie', title)
      };
    }
    case VisualizationTypes.VisualizationTypesEnum.FUNNEL: {
      const data = { values: buildKeyValueData(rows) };
      return {
        title, type, data, option: optionFromKeyValues(data.values, 'funnel', title)
      };
    }
    case VisualizationTypes.VisualizationTypesEnum.SCATTER: {
      const data = buildScatterData(rows);
      return {
        title, type, data, option: optionFromScatter(data, title)
      };
    }
    case VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD: {
      const data = buildWordCloudData(rows);
      return {
        title, type, data, option: optionFromWordCloud(data, title)
      };
    }
    case VisualizationTypes.VisualizationTypesEnum.CALENDAR: {
      const data = buildCalendarData(rows);
      return {
        title, type, data, option: optionFromCalendar(data, title)
      };
    }
    case VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH:
    case VisualizationTypes.VisualizationTypesEnum.SANKEY: {
      const data = buildNodeLinkData(rows);
      return {
        title, type, data, option: optionFromNodeLink(data, title, type)
      };
    }
    case VisualizationTypes.VisualizationTypesEnum.MATRIX: {
      const data = buildMatrixData(rows);
      return {
        title, type, data, option: optionFromMatrix(data, title)
      };
    }
    case VisualizationTypes.VisualizationTypesEnum.BAR_CHART:
    default: {
      const data = buildAxisData(rows);
      return {
        title,
        type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
        data,
        option: optionFromAxisData(data, 'bar', title)
      };
    }
  }
};

export {
  createOfficeVisualizationPreview
};
export type {
  OfficePreviewResult,
  OfficeRangePayload
};
