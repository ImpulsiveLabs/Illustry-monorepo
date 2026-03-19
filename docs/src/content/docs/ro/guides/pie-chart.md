---
title: Diagrama circulara
description: Pie Chart doc
---

The **Pie Chart** visualization is a concise and visually impactful way to represent the distribution of parts within a whole. It is particularly effective for displaying proportions and percentages in a circular format.


## Pie Chart Data Structure

To represent a Pie Chart, you can use the following `PieChartData` interface:

```typescript
{{PieChartData}}
```
### Key Attributes

- **values:** A dictionary where each key is a category or dimension, and the corresponding value is an numerical value. 


### Pros and Cons

#### Pros
- **Percentage Representation:** Pie Charts provide a clear representation of the percentage contribution of each category to the whole.

- **Visual Simplicity:** The circular shape and simplicity of Pie Charts make them easy for users to understand at a glance.

#### Cons
- **Limited for Many Categories:** When dealing with numerous categories, Pie Charts can become crowded and challenging to interpret.


## Pie Chart Example

![Pie Chart Example](/Illustry-monorepo/pie-chart.gif)