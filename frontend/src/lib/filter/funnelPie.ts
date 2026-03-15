import { VisualizationTypes } from '@illustry/types';
import { evaluateCondition } from './generic';

const funnelPieWords = ['values'];

const applyValuesFilter = (
  valuesFilter: string,
  defaultData: VisualizationTypes.FunnelData | VisualizationTypes.PieChartData
) => {
  try {
    let valuesOperations: string[] = [];
    const matchesValues = valuesFilter.match(/values\s*([><=!]*)\s*(\d+)/g);
    if (matchesValues) {
      valuesOperations = matchesValues.map((match) => {
        const [, operator = '', values = ''] = match.match(/values\s*([><=!]*)\s*(\d+)/) ?? [];
        const filterValue = values.trim();
        return `${operator}${filterValue}`;
      });
    }
    const filteredValues: { [key: string]: number } = {};
    Object.entries(defaultData.values).forEach(([key, value]) => {
      if (valuesOperations.length === 0
        || valuesOperations.every((condition) => evaluateCondition(value, condition))) {
        filteredValues[key] = value;
      }
    });

    return filteredValues;
  } catch (error) {
    return defaultData.values;
  }
};

const applyFunnelPieFilter = (
  expressions: string[],
  defaultData: VisualizationTypes.FunnelData | VisualizationTypes.PieChartData
) => {
  const newData: VisualizationTypes.FunnelData | VisualizationTypes.PieChartData = {
    values: {}
  };
  const valuesFilter = expressions.filter((expression) => expression.includes('values')).join('&&');
  if (valuesFilter !== '') {
    newData.values = applyValuesFilter(
      valuesFilter,
      defaultData
    );
  }
  return newData;
};

export { funnelPieWords, applyFunnelPieFilter };
