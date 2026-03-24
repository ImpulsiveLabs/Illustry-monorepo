import {
  DeepPartial,
  with_id,
  with_optional_id,
  with_optional_version,
  with_optional_properties,
} from "./utils";

// Word-cloud
type WordType = with_optional_properties & {
  name: string;
  value: number;
}

type WordCloudData = {
  words: WordType[];
}

// Calendar
type CalendarType = with_optional_properties & {
  date: string;
  value: number;
  category: string;
}

type CalendarData = {
  calendar: CalendarType[];
}

type TimelineEventTag = {
  name: string;
}

type TimelineEvent = {
  summary: string;
  date: string;
  type: string;
  author: string;
  tags?: TimelineEventTag[];
  description?: string;
}

type TimelineData = {
  [date: string]: {
    summary?: {
      title?: string;
    };
    events: TimelineEvent[];
  };
}

// Node-Link (force-directed-graph, sankey, hierarchical-edge-bundling )

type Label = {
  name: string;
  value: number;
  properties?: object | Array<object> | string;
}

type Node = with_optional_properties & {
  name: string;
  category: string;
  labels?: Label[];
}

type Link = with_optional_properties & {
  source: string;
  target: string;
  value: number;
}

type NodeLinkData = {
  nodes: Node[];
  links: Link[];
}

type AxisChartData = {
  headers: string[];
  values: { [key: string]: number[] };
}

type ScatterPoint = with_optional_properties & {
  value: [number, number];
  category: string;
}
type ScatterData = {
  points: ScatterPoint[];
}
type PieChartData = {
  values: { [key: string]: number };
}
type FunnelData = {
  values: { [key: string]: number };
}
type HierarchyNode = with_optional_properties & {
  name: string;
  value: number;
  category: string;
  children?: HierarchyNode[];
}

type HierarchyData = {
  nodes: HierarchyNode[];
}
enum VisualizationTypesEnum {
  WORD_CLOUD = "word-cloud",
  FORCE_DIRECTED_GRAPH = "force-directed-graph",
  SANKEY = "sankey",
  CALENDAR = "calendar",
  HIERARCHICAL_EDGE_BUNDLING = "hierarchical-edge-bundling",
  MATRIX = "matrix",
  LINE_CHART = "line-chart",
  BAR_CHART = "bar-chart",
  PIE_CHART = "pie-chart",
  SCATTER = "scatter",
  TREEMAP = "treemap",
  SUNBURST = "sunburst",
  FUNNEL = "funnel",
  TIMELINE = "timeline",
  EFFECT_SCATTER = "effectScatter",
  CANDLESTICK = "candlestick",
  RADAR = "radar",
  HEATMAP = "heatmap",
  TREE = "tree",
  MAP = "map",
  LINES = "lines",
  GRAPH = "graph",
  BOXPLOT = "boxplot",
  PARALLEL = "parallel",
  GAUGE = "gauge",
  THEME_RIVER = "themeRiver",
  PICTORIAL_BAR = "pictorialBar",
  CUSTOM = "custom"
}

type VisualizationDataData = WordCloudData
  | NodeLinkData
  | CalendarData
  | AxisChartData
  | ScatterData
  | PieChartData
  | HierarchyData
  | FunnelData
  | TimelineData;

type VisualizationData = {
  projectName: string;
  type: VisualizationTypesEnum | VisualizationTypesEnum[];
  description?: string;
  name: string;
  tags?: string | string[];
  data: VisualizationDataData;
  createdAt?: Date;
  updatedAt?: Date;
}

type VisualizationCreate =
  Omit<VisualizationData, "data"> &
  with_optional_id &
  with_optional_version &
  {
    data?: VisualizationDataData
  }

type VisualizationType =
  VisualizationData &
  with_id &
  with_optional_version

type ExtendedVisualizationType = {
  visualizations?: VisualizationType[];
  pagination?: {
    count: number;
    pageCount: number;
  };
}

type VisualizationUpdate = DeepPartial<VisualizationType>

type VisualizationFilter = {
  projectName?: string;
  type?: string | string[];
  name?: string;
  tags?: string;
  text?: string;
  page?: number;
  per_page?: number;
  sort?: {
    element: string;
    sortOrder: string | number;
  };
}

export {
  WordType,
  WordCloudData,
  CalendarType,
  CalendarData,
  TimelineEventTag,
  TimelineEvent,
  TimelineData,
  Label,
  Node,
  Link,
  VisualizationDataData,
  NodeLinkData,
  AxisChartData,
  ScatterData,
  ScatterPoint,
  PieChartData,
  FunnelData,
  HierarchyNode,
  HierarchyData,
  VisualizationTypesEnum,
  VisualizationData,
  VisualizationCreate,
  VisualizationType,
  ExtendedVisualizationType,
  VisualizationUpdate,
  VisualizationFilter
}
