import { VisualizationTypes } from '@illustry/types';
import { AllVisualizationsShell } from '../types/utils';
import { applyAxisFilter } from './axis';
import { applyCalendarFilter } from './calendar';
import { applyFunnelPieFilter } from './funnelPie';
import { validateExpressions } from './generic';
import { applyHierarchyFilter } from './hierarchy';
import { applyNodeLinkFilter } from './nodeLink';
import { applyScatterFilter } from './scatter';
import { applyTimelineFilter } from './timeline';
import { applyWordCloudFilter } from './wordcloud';

const acceptedSeparators = ['&&'];

const parseFilter = (
  expression: string,
  data: AllVisualizationsShell,
  words: string[],
  type: VisualizationTypes.VisualizationTypesEnum
) => {
  try {
    const separatorsRegex = new RegExp(
      acceptedSeparators
        .map(
          (sep) => `(${sep
            .replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
            .replace(/\|\|/g, '|')})`
        )
        .join('|'),
      'g'
    );

    const separators = [];
    const expressions = expression.split(separatorsRegex).map((part) => {
      if (acceptedSeparators.includes(part)) {
        separators.push(part);
        return undefined;
      }
      return part;
    });
    validateExpressions(
            expressions.filter((part) => part !== undefined) as string[],
            words
    );
    switch (type) {
      case VisualizationTypes.VisualizationTypesEnum.LINE_CHART:
      case VisualizationTypes.VisualizationTypesEnum.BAR_CHART:
        return applyAxisFilter(
                    expressions.filter((part) => part !== undefined) as string[],
                    data as VisualizationTypes.AxisChartData
        );
      case VisualizationTypes.VisualizationTypesEnum.CALENDAR:
        return applyCalendarFilter(
                    expressions.filter((part) => part !== undefined) as string[],
                    data as {
                        categories: string[];
                        calendar: VisualizationTypes.CalendarType[];
                    }
        );
      case VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH:
      case VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING:
      case VisualizationTypes.VisualizationTypesEnum.MATRIX:
      case VisualizationTypes.VisualizationTypesEnum.SANKEY:
        return applyNodeLinkFilter(
                    expressions.filter((part) => part !== undefined) as string[],
                    data as {
                        nodes: VisualizationTypes.Node[];
                        links: VisualizationTypes.Link[];
                    }
        );
      case VisualizationTypes.VisualizationTypesEnum.FUNNEL:
      case VisualizationTypes.VisualizationTypesEnum.PIE_CHART:
        return applyFunnelPieFilter(
                    expressions.filter((part) => part !== undefined) as string[],
                    data as VisualizationTypes.PieChartData | VisualizationTypes.FunnelData
        );
      case VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD:
        return applyWordCloudFilter(
                    expressions.filter((part) => part !== undefined) as string[],
                    data as VisualizationTypes.WordType[]
        );
      case VisualizationTypes.VisualizationTypesEnum.SCATTER:
        return applyScatterFilter(
                    expressions.filter((part) => part !== undefined) as string[],
                    data as {
                        points: (string | number)[][];
                        categories: string[];
                    }
        );
      case VisualizationTypes.VisualizationTypesEnum.TIMELINE:
        return applyTimelineFilter(
                    expressions.filter((part) => part !== undefined) as string[],
                    data as VisualizationTypes.TimelineData
        );
      case VisualizationTypes.VisualizationTypesEnum.SUNBURST:
      case VisualizationTypes.VisualizationTypesEnum.TREEMAP:
        return applyHierarchyFilter(
                    expressions.filter((part) => part !== undefined) as string[],
                    data as {
                        categories: string[]
                        nodes: VisualizationTypes.HierarchyNode[]
                    }
        );
      default:
        return data;
    }
  } catch (error: unknown) {
    throw new Error(
      `The expression could not be parsed. ${(error as Error).message}`
    );
  }
};

export default parseFilter;
