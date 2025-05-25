import { VisualizationTypes } from '@illustry/types';

const computeColors = (types: string[], colors: string[]) => {
  const color: { [key: string]: string } = {};
  types.forEach((cat, index) => {
    color[cat] = colors[index] as string;
  });
  return color;
};

const extractTimelineDataTypes = (data: VisualizationTypes.TimelineData): string[] => {
  let timelineDataTypes: string[] = [];

  Object.keys(data).forEach((date) => {
    if (data[date] && data[date]?.events) {
      const types = data[date]?.events.map((event) => event.type);
      timelineDataTypes = timelineDataTypes.concat(types as string[]);
    }
  });

  return Array.from(new Set(timelineDataTypes));
};

const groupEventsByDate = (events: VisualizationTypes.TimelineEvent[]): {
  [date: string]: VisualizationTypes.TimelineEvent[]
} => {
  const groupedEvents: { [date: string]: VisualizationTypes.TimelineEvent[] } = {};

  return events.reduce((groupedEv, event) => {
    const { date } = event;
    if (!event.date) {
      return groupedEv;
    }

    if (!groupedEv[date]) {
      groupedEvents[date] = [];
    }

    groupedEvents[date]?.push(event);

    return groupedEvents;
  }, groupedEvents);
};

export {
  computeColors,
  groupEventsByDate,
  extractTimelineDataTypes
};
