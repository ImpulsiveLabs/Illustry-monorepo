import { IllustryError } from '@illustry/core';

export const CLI_UNSUPPORTED_VISUALIZATION_TYPES = ['timeline'] as const;

export const CLI_VISUALIZATION_TYPES = [
  'word-cloud',
  'force-directed-graph',
  'sankey',
  'calendar',
  'hierarchical-edge-bundling',
  'matrix',
  'line-chart',
  'bar-chart',
  'pie-chart',
  'scatter',
  'treemap',
  'sunburst',
  'funnel'
] as const;

const supportedTypes = new Set<string>(CLI_VISUALIZATION_TYPES);
const unsupportedTypes = new Set<string>(CLI_UNSUPPORTED_VISUALIZATION_TYPES);

export const isCliVisualizationTypeSupported = (type?: string) => !type || supportedTypes.has(type);

export const isCliVisualizationTypeUnsupported = (type?: string) => Boolean(type && unsupportedTypes.has(type));

export const assertCliVisualizationTypeSupported = (type?: string) => {
  if (!type || supportedTypes.has(type)) return;
  const unsupported = unsupportedTypes.has(type);
  throw new IllustryError(
    unsupported
      ? `The CLI does not support "${type}" visualizations.`
      : `Unsupported CLI visualization type "${type}".`,
    {
      code: 'ILLUSTRY_CLI_UNSUPPORTED_VISUALIZATION_TYPE',
      status: 400,
      details: {
        type,
        supportedTypes: CLI_VISUALIZATION_TYPES
      }
    }
  );
};
