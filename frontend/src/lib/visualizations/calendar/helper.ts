import { VisualizationTypes } from '@illustry/types';

// Compute unique categories from calendar data
const computeCategoriesCalendar = (calendarData: VisualizationTypes.CalendarType[]): string[] => [
  ...new Set(calendarData.map((cal) => cal.category))
];

// Compute color mapping for categories
const computeColors = (categories: string[], colors: string[]): Record<string, string> => {
  const color: Record<string, string> = {};
  categories.forEach((cat, index) => {
    color[cat] = colors[index] ?? '#000000'; // Fallback to black if colors run out
  });
  return color;
};
const computeLegendColors = (categories: string[], colors: string[]) => {
  const color: { [key: string]: string } = {};
  categories.forEach((cat, index) => {
    color[cat] = colors[index] as string;
  });
  return color;
};

// Compute heatmap data point for a calendar element
const computeElementsCalendar = (element: VisualizationTypes.CalendarType): [string, number, string] => {
  const { date, value, category } = element;
  return [date, value ?? 1, category];
};

// Compute tooltip HTML content
const computePropertiesForToolTip = (
  properties: string | Record<string, string | number> | null,
  value?: number | string
): string => {
  let prop = '';
  if (properties) {
    if (typeof properties === 'object') {
      Object.entries(properties).forEach(([key, propValue]) => {
        prop += `<div style="font-weight: bold">${key}:${propValue}</div>`;
      });
    } else if (typeof properties === 'string') {
      prop += properties;
    }
  }
  if (value !== undefined) {
    prop += `<div style="font-weight: bold">value:${value}</div>`;
  }
  return prop;
};

const computeCalendar = (
  calendarData: VisualizationTypes.CalendarType[],
  textColor: string
): {
  calendar: Array<{
    top: number;
    left: number;
    right: number;
    cellSize: [string, number];
    range: string;
    itemStyle: { borderWidth: number };
    orient: 'horizontal';
    dayLabel: { show: boolean; fontSize: number; textStyle: { color: string } };
    monthLabel: { show: boolean; fontSize: number; textStyle: { color: string } };
    yearLabel: { show: boolean; fontSize: number; position: string; textStyle: { color: string } };
  }>;
  series: Array<{
    type: 'heatmap';
    coordinateSystem: 'calendar';
    calendarIndex: number;
    data: Array<[string, number, string]>;
  }>;
  encode: { time: number; value: number; category: number };
} => {
  const years = [
    ...new Set(
      calendarData
        .map((cal) => {
          const year = new Date(cal.date).getFullYear();
          return Number.isNaN(year) ? null : year;
        })
        .filter((year): year is number => year !== null)
    )
  ].sort((a, b) => a - b); // Sort ascending for consistent order

  // Group data by year, ensuring dates match the year
  const groupedByYears: Record<string, Array<[string, number, string]>> = {};
  calendarData.forEach((event) => {
    const date = new Date(event.date);
    const eventYear = date.getFullYear();
    if (Number.isNaN(eventYear)) {
      return;
    }
    const yearStr = eventYear.toString();
    if (!years.includes(eventYear)) {
      return;
    }
    if (!groupedByYears[yearStr]) {
      groupedByYears[yearStr] = [];
    }
    groupedByYears[yearStr]?.push(computeElementsCalendar(event));
  });

  const series = years.map((year, index) => ({
    type: 'heatmap' as const,
    coordinateSystem: 'calendar' as const,
    calendarIndex: index,
    data: groupedByYears[year.toString()] || []
  }));

  return {
    calendar: years.map((year, index) => ({
      top: (index + 1) * 150,
      left: 30,
      right: 30,
      cellSize: ['auto', 13] as [string, number],
      range: year.toString(),
      itemStyle: {
        borderWidth: 0.5
      },
      orient: 'horizontal' as const,
      dayLabel: {
        show: true,
        fontSize: 14,
        textStyle: { color: textColor }
      },
      monthLabel: {
        show: true,
        fontSize: 14,
        textStyle: { color: textColor }
      },
      yearLabel: {
        show: true,
        fontSize: 14,
        position: 'top',
        textStyle: { color: textColor }
      }
    })),
    series,
    encode: {
      time: 0,
      value: 1,
      category: 2
    }
  };
};

export {
  computeCategoriesCalendar,
  computeColors,
  computeLegendColors,
  computePropertiesForToolTip,
  computeCalendar
};
