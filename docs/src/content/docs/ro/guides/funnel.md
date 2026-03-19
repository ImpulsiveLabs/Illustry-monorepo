---
title: Funnel
description: Funnel doc
---

The **Funnel** visualization is a powerful tool for tracking the progression and conversion rates of a series of stages in a process. It provides a visual representation of how entities move through different stages of a defined workflow.



## Funnel Data Structure

To represent a Funnel, you can use the following `FunnelData` interface:

```typescript
{{FunnelData}}
```
### Key Attributes

- **values:** A dictionary where each key is a category or dimension, and the corresponding value is an numerical value. 


### Pros and Cons

#### Pros
- **Performance Metrics:** Funnel Charts are excellent for visualizing performance metrics, enabling teams to track and improve key indicators.

- **Segmented Analysis:** Each stage in the funnel allows for segmented analysis, helping identify specific areas of improvement or success.

- **Predictive Insights:** Funnel Charts can provide predictive insights into future performance based on historical conversion rates.

#### Cons

- **Challenge with Complex Processes:** In scenarios where processes involve numerous intricate branches or loops, Funnel Charts may struggle to represent the complexity effectively.


## Funnel Example

![Funnel Example](/Illustry-monorepo/funnel.gif)