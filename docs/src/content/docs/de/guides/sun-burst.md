---
title: Sunburst
description: Sun Burst doc
---

The **Sun Burst Chart** visualization is a dynamic and engaging representation of hierarchical data. It uses a radial layout to convey the hierarchy of elements and their relationships within a dataset.


## Sun Burst Data Structure

To represent a Map Data, you can use the following `HierarchyData` interface:

```typescript
{{HierarchyNode}}

{{HierarchyData}}
```
### Key Attributes

- **name:** The node name.
- **value:** A number that represents a metric to determine how big that node is.
- **category:**  Describes the category or type to which the node belongs.
- **children:**  This property is optional and represents an array of HierarchyNode objects. It signifies that the node can have child nodes, creating a hierarchical structure. Each child node follows the same HierarchyNode structure, allowing the representation of a tree-like hierarchy.

### Pros and Cons

#### Pros
- **Hierarchical Understanding:** Sunbursts excel in displaying hierarchical data structures, providing a visual hierarchy that aids in understanding relationships between different levels.

- **Radial Layout:** The radial layout provides a visually appealing and organized representation of hierarchical structures.

#### Cons
- **Potential Clutter:** In cases with a large number of segments, the chart may become cluttered, affecting readability.

- **Limited to Hierarchical Data:** Treemaps are most effective when visualizing hierarchical data; for non-hierarchical datasets, alternative visualizations may be more suitable.

## Sun Burst Example

![Sun Burst Example](/Illustry-monorepo/sun-burst.gif)