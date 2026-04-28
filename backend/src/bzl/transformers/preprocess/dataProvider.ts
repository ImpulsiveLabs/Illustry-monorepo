import {
  TransformerTypes,
  VisualizationTypes
} from '@illustry/types';
import { visualizationPropertiesExtractor } from '../../../utils/helper';
import {
  nodesLinksExtractorCsvOrExcel,
  nodeLinksExtractorXml
} from './transformers/nodeLinkTransformers';
import {
  wordCloudExtractorCsvOrExcel,
  wordCloudExtractorXml
} from './transformers/wordCloudTransformer';
import {
  axisChartExtractorCsvOrExcel,
  axisChartExtractorXml
} from './transformers/axisChartTransformer';
import {
  calendarExtractorCsvOrExcel,
  calendarExtractorXml
} from './transformers/calendarTransformers';
import {
  hierarchyExtractorCsvOrExcel,
  hierarchyExtractorXml
} from './transformers/hierarchyTransformers';
import matrixExtractorXml from './transformers/matrixTransformer';
import {
  pieChartFunnelExtractorCsvOrExcel,
  pieChartFunnelExtractorXml
} from './transformers/pieChartFunnelTransformer';
import {
  scatterExtractorCsvOrExcel,
  scatterExtractorXml
} from './transformers/scatterTransformer';

const isIntersectionEqualToFirstArray = (A: string[], B: string[]): boolean => {
  const setB = new Set(B);
  return A.every((element) => setB.has(element));
};

const exelOrCsvdataProvider = (
  type: VisualizationTypes.VisualizationTypesEnum,
  computedRows: TransformerTypes.RowType[],
  allFileDetails: boolean
) => {
  let data: VisualizationTypes.VisualizationUpdate = { type };
  const visualizationProperties = allFileDetails ? visualizationPropertiesExtractor(computedRows) : null;
  if (visualizationProperties) {
    const { name, description, tags } = visualizationProperties;
    data = {
      ...data,
      name,
      tags,
      description
    };
  }
  switch (type) {
    case VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD:
      data.data = wordCloudExtractorCsvOrExcel(
        computedRows as TransformerTypes.SimpleWordDetails[] | TransformerTypes.FullWordDetails[]
      );
      break;
    case VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH:
    case VisualizationTypes.VisualizationTypesEnum.SANKEY:
    case VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING:
      data.data = nodesLinksExtractorCsvOrExcel(
        computedRows as TransformerTypes.SimpleNodeLinkDetails[] | TransformerTypes.FullNodeLinkDetails[]
      );
      break;
    case VisualizationTypes.VisualizationTypesEnum.CALENDAR:
      data.data = calendarExtractorCsvOrExcel(
        computedRows as TransformerTypes.SimpleCalendarDetails[] | TransformerTypes.FullCalendarDetails[]
      );
      break;
    case VisualizationTypes.VisualizationTypesEnum.BAR_CHART:
    case VisualizationTypes.VisualizationTypesEnum.LINE_CHART:
      data.data = axisChartExtractorCsvOrExcel(
        computedRows as TransformerTypes.SimpleAxisChartValuesDetails[] | TransformerTypes.FullAxisChartValuesDetails[]
      );
      break;
    case VisualizationTypes.VisualizationTypesEnum.FUNNEL:
    case VisualizationTypes.VisualizationTypesEnum.PIE_CHART:
      data.data = pieChartFunnelExtractorCsvOrExcel(
        computedRows as TransformerTypes.SimplePieChartValuesDetails[] | TransformerTypes.FullPieChartValuesDetails[]
      );
      break;
    case VisualizationTypes.VisualizationTypesEnum.SCATTER:
      data.data = scatterExtractorCsvOrExcel(
        computedRows as TransformerTypes.SimplePointDetails[] | TransformerTypes.FullPointDetails[]
      );
      break;
    case VisualizationTypes.VisualizationTypesEnum.TREEMAP:
    case VisualizationTypes.VisualizationTypesEnum.SUNBURST:
      data.data = hierarchyExtractorCsvOrExcel(
        computedRows as TransformerTypes.SimpleNodesDetails[] | TransformerTypes.FullNodesDetails[]
      );
      break;
    default:
      break;
  }
  return data?.data ? data : null;
};

const jsonDataProvider = (
  type: VisualizationTypes.VisualizationTypesEnum | VisualizationTypes.VisualizationTypesEnum[],
  computedData: VisualizationTypes.VisualizationDataData,
  allFileDetails: boolean
) => {
  const allPossibleTypes = Object.values(VisualizationTypes.VisualizationTypesEnum);
  if (
    (Array.isArray(type) && !isIntersectionEqualToFirstArray(type, allPossibleTypes))
    || (typeof type === 'string' && !allPossibleTypes.includes(type))
  ) {
    return null;
  }
  if (!allFileDetails) {
    const data: VisualizationTypes.VisualizationUpdate = {};
    data.data = computedData;
    data.type = type;
    return data;
  }
  return computedData;
};

const xmlDataProvider = (
  type: VisualizationTypes.VisualizationTypesEnum,
  computedData: TransformerTypes.XMLVisualizationDetails,
  allFileDetails: boolean
) => {
  switch (type) {
    case VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH:
    case VisualizationTypes.VisualizationTypesEnum.SANKEY:
    case VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING:
      return nodeLinksExtractorXml(computedData, allFileDetails);
    case VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD:
      return wordCloudExtractorXml(computedData, allFileDetails);
    case VisualizationTypes.VisualizationTypesEnum.CALENDAR:
      return calendarExtractorXml(computedData, allFileDetails);
    case VisualizationTypes.VisualizationTypesEnum.LINE_CHART:
    case VisualizationTypes.VisualizationTypesEnum.BAR_CHART:
      return axisChartExtractorXml(computedData, allFileDetails);
    case VisualizationTypes.VisualizationTypesEnum.PIE_CHART:
    case VisualizationTypes.VisualizationTypesEnum.FUNNEL:
      return pieChartFunnelExtractorXml(computedData, allFileDetails);
    case VisualizationTypes.VisualizationTypesEnum.SCATTER:
      return scatterExtractorXml(computedData, allFileDetails);
    case VisualizationTypes.VisualizationTypesEnum.SUNBURST:
    case VisualizationTypes.VisualizationTypesEnum.TREEMAP:
      return hierarchyExtractorXml(computedData, allFileDetails);
    case VisualizationTypes.VisualizationTypesEnum.MATRIX:
      return matrixExtractorXml(computedData, allFileDetails);
    default:
      return null;
  }
};

export { xmlDataProvider, jsonDataProvider, exelOrCsvdataProvider };
