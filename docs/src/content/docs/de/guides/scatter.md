---
title: Streudiagramm
description: Scatter doc
---

The **Scatter Plot** visualization is a powerful tool for visualizing the relationships between two numerical variables. It uses points on a Cartesian plane to represent individual data points, making it easy to identify patterns, correlations, and outliers.


## Scatter Plot Data Structure

To represent a Scatter Plot, you can use the following `ScatterData` interface:

```typescript
{{ScatterPoint}}

{{ScatterData}}
```

### Key Attributes

- **value:** An array of two numerical values [x, y], representing the coordinates of a data point on the X and Y axes.
- **values:** A string indicating the category or group to which the data point belongs.


### Pros and Cons

#### Pros
- **Relationship Identification:** Scatter Plots excel at revealing relationships, patterns, and trends between two numerical variables.

- **Outlier Detection:** Outliers, or data points that deviate significantly from the norm, are easily identified on a Scatter Plot.

#### Cons

- **Potential Overplotting:** In cases with a high density of data points, overplotting may occur, affecting the visibility of individual points.

## Scatter Plot Example

![Scatter Plot Example](/Illustry-monorepo/scatter.gif)