---
title: Graphique en barres
description: Bar Chart doc
---

The **Bar Chart** visualization is a versatile and effective tool for representing categorical data in a visually engaging manner. It uses horizontal or vertical bars to show the values of different categories, making it easy for users to compare and understand data distributions.

## Bar Chart Data Structure

To represent a Bar Chart, you can use the following `AxisChartData` interface:

```typescript
{{AxisChartData}}
```
### Key Attributes

- **headers:** An array of strings representing the categories or dimensions along one of the axis.
- **values:** A dictionary where each key is a category or dimension, and the corresponding value is an array of numerical values along the other axis. 


### Pros and Cons

#### Pros
- **Multi-Dimensional Comparison:** Bar Charts excel at comparing multiple dimensions simultaneously, providing a comprehensive view of the data.

- **Clear Value Representation:** Numerical values are clearly represented along both the X and Y axes, making it easy for users to interpret and compare.

#### Cons
- **Complexity with Excessive Categories:** When dealing with a large number of categories or dimensions, the visualization may become crowded and challenging to interpret.

- **Limited for Categorical Data:** Bar Charts are most effective for numerical data and may not be the optimal choice for representing categorical data.

## Bar Chart Example

![Bar Chart Example](/Illustry-monorepo/bar-chart.gif)
