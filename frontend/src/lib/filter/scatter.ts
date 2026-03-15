import { evaluateCondition } from './generic';

const scatterWords = [
  'categories',
  'xCoord',
  'yCoord'
];

const applyCategoriesFilter = (categoriesFilter: string, defaultData: {
  points: (string | number)[][];
  categories: string[];
}): string[] => {
  const includedCategories: string[] = [];
  const excludedCategories: string[] = [];

  try {
    const matches = categoriesFilter.match(/categories\s*([!=]+)\s*\[([^\]]+)\]/g);

    if (matches) {
      matches.forEach((match) => {
        const [, operator = '', values = ''] = match.match(/categories\s*([!=]+)\s*\[([^\]]+)\]/) ?? [];
        const filterCategories = values
          .replace(/'/g, '')
          .split(/\s*,\s*/)
          .filter(Boolean);
        if (operator === '=') {
          includedCategories.push(...filterCategories);
        } else if (operator === '!=') {
          excludedCategories.push(...filterCategories);
        }
      });
      const filteredCategories = defaultData.categories.filter(
        (cat) => (includedCategories.length && includedCategories.includes(cat))
          || (excludedCategories.length && !excludedCategories.includes(cat))
      );
      return filteredCategories;
    }
  } catch (error) {
    return defaultData.categories;
  }
  return [];
};

const applyPointsFilter = (
  filter: string,
  defaultData: {
    points: (string | number)[][];
    categories: string[];
  },
  filterType: string
) => {
  try {
    let valuesOperations: string[] = [];
    const regexPattern = new RegExp(
      `${filterType}\\s*([><=!]*)\\s*(\\d+)`,
      'g'
    );
    const matchesValues = filter.match(regexPattern);
    if (matchesValues) {
      valuesOperations = matchesValues.map((match) => {
        const internRegexPattern = new RegExp(
          `${filterType}\\s*([><=!]*)\\s*(\\d+)`
        );
        const [, operator = '', values = ''] = match.match(internRegexPattern) ?? [];
        const filterValue = values.trim();
        return `${operator}${filterValue}`;
      });
    }
    const filteredPoints = defaultData.points.map((point) => {
      if (valuesOperations.length > 0) {
        // eslint-disable-next-line max-len
        if (valuesOperations.every((condition) => evaluateCondition(filterType === 'xCoord' ? point[0] as number : point[1] as number, condition))) {
          return point;
        }
        return [0, 0];
      }
      return point;
    });
    return filteredPoints;
  } catch (error) {
    return defaultData.points;
  }
};

const applyScatterFilter = (
  expressions: string[],
  defaultData: {
    points: (string | number)[][];
    categories: string[];
  }
) => {
  const newData: {
    points: (string | number)[][];
    categories: string[];
  } = { points: [...defaultData.points], categories: [...defaultData.categories] };
  const categoriesFilter = expressions.filter((expression) => expression.includes('categories')).join('&&');
  const xCoordFilter = expressions.filter((expression) => expression.includes('xCoord')).join('&&');
  const yCoordFilter = expressions.filter((expression) => expression.includes('yCoord')).join('&&');
  if (categoriesFilter !== '') {
    newData.categories = applyCategoriesFilter(categoriesFilter, newData);
  }
  if (yCoordFilter !== '') {
    newData.points = applyPointsFilter(yCoordFilter, newData, 'yCoord');
  }
  if (xCoordFilter !== '') {
    newData.points = applyPointsFilter(xCoordFilter, newData, 'xCoord');
  }
  return newData;
};

export { scatterWords, applyScatterFilter };
