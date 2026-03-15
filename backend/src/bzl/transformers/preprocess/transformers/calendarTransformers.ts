import { VisualizationTypes, TransformerTypes } from '@illustry/types';
import { toStringWithDefault, visualizationDetailsExtractor } from '../../../../utils/helper';

const reformatDate = (date: string): string | null => {
  // eslint-disable-next-line max-len
  const dateRegex = /\b(?:\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{1,2}[./-]\d{1,2}[./-]\d{2}|\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4}|\d{2}-\d{2}-\d{2})\b/;
  const matches = date.match(dateRegex);

  if (matches && matches.length > 0) {
    const originalDate = matches[0];
    const dateComponents = originalDate.split(/[-./]/);

    const year = +dateComponents.find((component) => component.length === 4)!;
    const [component1, component2] = dateComponents.filter(
      (component) => component.length <= 2 && component !== '0000'
    );

    const tryOrdering = (month: number, day: number) => month > 0 && month <= 12 && day > 0 && day <= 31;

    if (tryOrdering(+component1, +component2)) {
      return `${year}-${String(component1).padStart(2, '0')}-${String(component2).padStart(2, '0')}`;
    }
    if (tryOrdering(+component2, +component1)) {
      return `${year}-${String(component2).padStart(2, '0')}-${String(component1).padStart(2, '0')}`;
    }
  }
  return null;
};

const excelDateToJSDate = (excelDate: number): string | null => {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const daysSinceExcelEpoch = excelDate - 25569;
  const millisecondsSinceExcelEpoch = daysSinceExcelEpoch * millisecondsPerDay;
  const jsDate = new Date(millisecondsSinceExcelEpoch);

  // eslint-disable-next-line max-len
  return `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, '0')}-${String(jsDate.getDate()).padStart(2, '0')}`;
};

const formatDateObject = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const calendarTransformer = (
  mapping: { [key: string]: string },
  values: (string | number)[],
  allFileDetails: boolean
): TransformerTypes.FullCalendarDetails | TransformerTypes.SimpleCalendarDetails => {
  const {
    dates, values: mValues, categories, properties
  } = mapping;
  const dateValue = values[+dates] as unknown;
  const calendar: TransformerTypes.CalendarType = {
    date: typeof dateValue === 'string'
      ? reformatDate(dateValue)
      : dateValue instanceof Date
        ? formatDateObject(dateValue)
        : excelDateToJSDate(dateValue as number),
    value:
      typeof values[+mValues] === 'string'
        ? +(values[+mValues])
        : values[+mValues] as number,
    category:
      typeof values[+categories] === 'string'
        ? values[+categories] as string
        : toStringWithDefault(values[+categories]),
    properties:
      typeof values[+properties] === 'string'
        ? values[+properties] as string
        : toStringWithDefault(values[+properties])
  };
  if (allFileDetails) {
    const { visualizationDescription, visualizationName, visualizationTags } = visualizationDetailsExtractor(mapping, values);
    const fullCalendarDetails: TransformerTypes.FullCalendarDetails = {
      calendar,
      visualizationDescription,
      visualizationName,
      visualizationTags
    };
    return fullCalendarDetails;
  }
  return { calendar };
};

const calendarExtractorCsvOrExcel = (
  data: TransformerTypes.SimpleCalendarDetails[] | TransformerTypes.FullCalendarDetails[]
): VisualizationTypes.CalendarData => {
  const transformedData = data.reduce(
    (result, item) => {
      const calendarData = item.calendar;
      const {
        category, date, value, properties
      } = calendarData;
      let calendar = null;
      if (result.calendar) {
        calendar = result.calendar.find(
          (n: VisualizationTypes.CalendarType) => n.date === date && n.category === category
        );
      }
      if (!calendar) {
        calendar = {
          category,
          date,
          value,
          properties
        } as VisualizationTypes.CalendarType;
        if (
          category
          && date
          && value
        ) {
          (result.calendar as VisualizationTypes.CalendarType[]).push(calendar);
        }
      }

      return result;
    },
    { calendar: [] }
  );
  return transformedData;
};

const calendarEventExtractorXml = (
  calendar: TransformerTypes.XMLCalendar[]
): VisualizationTypes.CalendarType[] => calendar.map((el) => {
  const {
    category, date, value, properties
  } = el;
  const finalCalendar: VisualizationTypes.CalendarType = {
    category: category[0],
    date: reformatDate(date[0]) as string,
    value: +value[0]
  };
  if (properties) {
    finalCalendar.properties = properties;
  }
  return finalCalendar;
});

const calendarExtractorXml = (
  xmlData: TransformerTypes.XMLVisualizationDetails,
  allFileDetails: boolean
): VisualizationTypes.VisualizationCreate | { data: VisualizationTypes.CalendarData } => {
  const {
    name, description, tags, type, data: rootData
  } = xmlData.root;
  const {
    calendar
  } = rootData[0] as TransformerTypes.XMLCalendarData;
  const data = {
    data: {
      calendar: calendarEventExtractorXml(calendar)
    }
  };
  if (allFileDetails) {
    return {
      ...data,
      ...{
        name: name[0],
        description: description ? description[0] : '',
        tags,
        type: type[0]
      }
    };
  }
  return data;
};

export {
  calendarTransformer, calendarExtractorCsvOrExcel, calendarExtractorXml, reformatDate, excelDateToJSDate
};
