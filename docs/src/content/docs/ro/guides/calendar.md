---
title: Calendar
description: Calendar doc
---

The **Calendar** visualization is a unique representation designed to provide insights into temporal relationships within a dataset. It offers a distinctive approach to visualizing events, occurrences, or entities over time.

## Calendar Data Structure

To represent a Calendar, you can use the following `CalendarData` interface:

```typescript
{{CalendarType}}

{{CalendarData}}
```
### Key Attributes

- **date:** A unique date of a specific year.
- **value:** How impactful that date was for the event.
- **category:** Categorizes the dates into a specific events.


### Pros and Cons

#### Pros
- **Relationship Visualization:** The calendar visualization provides an intuitive and user-friendly way to explore temporal relationships, making it easy for users to understand patterns over time.

- **Compact Representation:** A calendar optimizes space by presenting events in a compact format, allowing users to view a significant amount of temporal data without overwhelming visuals.

- **Multiple years:** If the events are happening on a multi-year timespan more calendar visualizations will be displayed.

#### Cons
- **Complexity with Dense Graphs:** Due to its compact nature, a calendar may provide limited space for detailing each event. In scenarios requiring extensive information, additional interactions or supplementary views may be necessary.

- **Not Ideal for Dense Event Overlaps:** In cases where multiple events overlap closely in time, the visualization might face challenges in maintaining clarity and preventing overlap-related visual clutter.

## Calendar Example

![Calendar Example](/Illustry-monorepo/calendar.gif)