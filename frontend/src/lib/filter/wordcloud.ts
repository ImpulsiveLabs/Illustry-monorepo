import { VisualizationTypes } from '@illustry/types';
import { evaluateCondition } from './generic';

const wordCloudWords = ['values'];

const applyValuesFilter = (
  valuesFilter: string,
  defaultData: VisualizationTypes.WordType[]
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
    const filteredValues = defaultData.filter((word) => {
      if (valuesOperations.length > 0) {
        return valuesOperations
          .every((condition) => evaluateCondition(word.value, condition));
      }
      return true;
    });

    return filteredValues;
  } catch (error) {
    return defaultData;
  }
};

const applyWordCloudFilter = (expressions: string[], defaultData: VisualizationTypes.WordType[]) => {
  let newData: VisualizationTypes.WordType[] = [];
  const valuesFilter = expressions.filter((expression) => expression.includes('values')).join('&&');
  if (valuesFilter !== '') {
    newData = applyValuesFilter(
      valuesFilter,
      defaultData
    );
  }
  return newData;
};

export { wordCloudWords, applyWordCloudFilter };
