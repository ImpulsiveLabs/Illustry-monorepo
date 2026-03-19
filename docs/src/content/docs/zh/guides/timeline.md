---
title: 时间线
description: Timeline doc
---

The **Timeline** is a versatile visualization that displays events or activities chronologically over time. It offers a comprehensive view of historical or future occurrences, providing insights into patterns, durations, and relationships.


## Timeline Data Structure

To represent a Timeline Data, you can use the following `TimelineData` interface:

```typescript
{{TimelineEventTag}}

{{TimelineEvent}}

{{TimelineData}}
```
### Key Attributes

#### TimelineEventTag
- **name:** The name of the tag associated with a Timeline event.

#### TimelineEvent
- **summary:** A brief summary or title of the event.
- **date:** The date when the event occurred.
- **type:** The type or category of the event.
- **author:** The author or creator of the event.
- **tags:** An array of tags associated with the event.
- **description:** A detailed description of the event.

#### TimelineData
- **[date]:** The date key representing a specific date range.
  - **summary:**
    - **title:** A summary title for the date range.
  - **events:** An array of `TimelineEvent` objects associated with that date.

### Pros and Cons

#### Pros
- **Chronological Understanding:** Timelines offer a chronological representation of events, providing a clear understanding of the sequence in which they occurred.

- **Event Categorization:** The ability to categorize events using tags allows for organized and efficient grouping, aiding in the analysis of specific types of events.

- **Flexible Visualization:** Timelines are flexible and can adapt to various types of data, making them suitable for representing a wide range of events and activities.

#### Cons
- **Potential Crowding:** In timelines with a high density of events, there is a risk of visual clutter and potential difficulty in distinguishing individual events.

- **Limited for Certain Data Types:** While timelines are versatile, they may not be the most effective for representing certain complex relationships or data structures.

- **Subjectivity in Event Importance:** The importance of events may be subjective, and their representation on a timeline might not capture the nuanced significance perceived by individuals..

## Timeline Example

![Timeline Example](/Illustry-monorepo/timeline.gif)