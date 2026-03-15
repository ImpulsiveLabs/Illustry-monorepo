import { VisualizationTypes } from '@illustry/types';
import { evaluateCondition } from './generic';

const calendarWords = ['categories', 'dates'];

const applyDatesFilter = (
  datesFilter: string,
  defaultData: {
    categories: string[];
    calendar: VisualizationTypes.CalendarType[];
  }
) => {
  try {
    let datesOperations: string[] = [];
    const matchesValues = datesFilter.match(/dates\s*([><=!]*)\s*(['"]?)(\d{4}-\d{2}-\d{2})\2/g);

    if (matchesValues) {
      datesOperations = matchesValues.map((match) => {
        const [, operator = '', , values = ''] = match.match(/dates\s*([><=!]*)\s*(['"]?)(\d{4}-\d{2}-\d{2})\2/) ?? [];
        const filterValue = values.trim();
        return `${operator}${filterValue}`;
      });
    }

    const filteredValues = defaultData.calendar
      .filter((calendar) => {
        if (datesOperations.length > 0) {
          return datesOperations
            .every((condition) => evaluateCondition(calendar.date, condition, true));
        }
        return true;
      });

    return filteredValues;
  } catch (error) {
    return defaultData.calendar;
  }
};

const applyCategoriesFilter = (categoriesFilter: string, defaultData: {
  categories: string[];
  calendar: VisualizationTypes.CalendarType[];
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

const applyCalendarFilter = (expressions: string[], defaultData: {
  categories: string[];
  calendar: VisualizationTypes.CalendarType[];
}) => {
  const newData: {
    categories: string[];
    calendar: VisualizationTypes.CalendarType[];
  } = {
    categories: [...defaultData.categories],
    calendar: [...defaultData.calendar]
  };
  const categoriesFilter = expressions.filter((expression) => expression.includes('categories')).join('&&');
  const datesFilter = expressions.filter((expression) => expression.includes('dates')).join('&&');
  if (categoriesFilter !== '') {
    newData.categories = applyCategoriesFilter(categoriesFilter, newData);
    if (newData.categories.length) {
      const categorySet = new Set(newData.categories);
      newData.calendar = newData.calendar.filter(
        (event) => event.category && categorySet.has(event.category)
      );
    } else {
      newData.calendar = [];
    }
  }
  if (datesFilter !== '') {
    newData.calendar = applyDatesFilter(
      datesFilter,
      newData
    );
  }
  if (categoriesFilter === '' && datesFilter !== '') {
    newData.categories = [...new Set(newData.calendar
      .map((event) => event.category)
      .filter((category): category is string => Boolean(category)))];
  }
  return newData;
};

export { calendarWords, applyCalendarFilter };
