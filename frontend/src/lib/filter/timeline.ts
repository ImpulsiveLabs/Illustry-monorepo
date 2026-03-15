import { VisualizationTypes } from '@illustry/types';
import { evaluateCondition } from './generic';

const timelineWords = ['types', 'dates', 'authors'];

const applyDatesFilter = (
  datesFilter: string,
  defaultData: VisualizationTypes.TimelineData
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

    const filteredKeys = Object.keys(defaultData)
      .filter((date) => {
        if (datesOperations.length > 0) {
          return datesOperations
            .every((condition) => evaluateCondition(date, condition, true));
        }
        return true;
      });
    const filteredValues: VisualizationTypes.TimelineData = {};

    filteredKeys.forEach((key) => {
      const value = defaultData[key];
      if (value) {
        filteredValues[key] = value;
      }
    });

    return filteredValues;
  } catch (error) {
    return defaultData;
  }
};

const applyEventsFilter = (
  filter: string,
  defaultData: VisualizationTypes.TimelineData,
  filterType: string
) => {
  const included: string[] = [];
  const excluded: string[] = [];

  try {
    const regexPattern = new RegExp(
      `${filterType}\\s*([!=]+)\\s*\\[([^\\]]+)\\]`,
      'g'
    );
    const matches = filter.match(regexPattern);

    if (matches) {
      matches.forEach((match) => {
        const innerRegexPattern = new RegExp(
          `${filterType}\\s*([!=]+)\\s*\\[([^\\]]+)\\]`
        );
        const [, operator = '', values = ''] = match.match(innerRegexPattern) ?? [];
        const filterCategories = values
          .replace(/'/g, '')
          .split(/\s*,\s*/)
          .filter(Boolean);
        if (operator === '=') {
          included.push(...filterCategories);
        } else if (operator === '!=') {
          excluded.push(...filterCategories);
        }
      });
    }
    const filteredData: VisualizationTypes.TimelineData = {};

    Object.keys(defaultData).forEach((date) => {
      const events = defaultData[date]?.events || [];

      const filteredEvents = events.filter((event) => {
        const eventData = filterType === 'authors' ? event.author : event.type;

        if (
          (included.length === 0 || included.includes(eventData))
          && (excluded.length === 0 || !excluded.includes(eventData))
        ) {
          return true;
        }
        return false;
      });
      if (filteredEvents.length > 0) {
        filteredData[date] = {
          ...defaultData[date],
          events: filteredEvents
        };
      }
    });

    return filteredData;
  } catch (error) {
    return defaultData;
  }
};

const applyTimelineFilter = (expressions: string[], defaultData: VisualizationTypes.TimelineData) => {
  let newData: VisualizationTypes.TimelineData = { ...defaultData };
  const datesFilter = expressions.filter((expression) => expression.includes('dates')).join('&&');
  const authorsFilter = expressions.filter((expression) => expression.includes('authors')).join('&&');
  const typesFilter = expressions.filter((expression) => expression.includes('types')).join('&&');
  if (datesFilter !== '') {
    newData = applyDatesFilter(datesFilter, newData);
  }
  if (authorsFilter !== '') {
    newData = applyEventsFilter(authorsFilter, newData, 'authors');
  }
  if (typesFilter !== '') {
    newData = applyEventsFilter(typesFilter, newData, 'types');
  }
  return newData;
};

export { timelineWords, applyTimelineFilter };
