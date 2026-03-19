---
title: Tree Map
description: Tree Map doc
---

The **Tree Map** visualization is a dynamic and hierarchical way of representing data that provides a clear overview of complex structures. By utilizing nested rectangles, the Treemap efficiently visualizes hierarchical data relationships, making it an invaluable tool for conveying both the whole and the parts within a dataset.

## Tree Map Data Structure

To represent a Tree Map Data, you can use the following `HierarchyData` interface:

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
- **Hierarchical Understanding:** Treemaps excel in displaying hierarchical data structures, providing a visual hierarchy that aids in understanding relationships between different levels.

- **Proportional Representation:** The proportional sizing of rectangles allows for an intuitive representation of the relative values or sizes of different data categories.

- **Space Efficiency:** Treemaps efficiently use space, enabling users to visualize large datasets without cluttering the screen.

- **Quick Identification of Patterns:** Users can swiftly identify patterns, outliers, and concentrations within the dataset through the visual arrangement of rectangles.

#### Cons
- **Complexity with Overlapping Labels:** In cases where labels overlap, especially in densely populated Treemaps, readability can be a challenge.

- **Difficulty in Precision:** While Treemaps provide a broad overview, achieving precise comparisons between individual data points might be challenging due to the hierarchical nature.

- **Limited to Hierarchical Data:** Treemaps are most effective when visualizing hierarchical data; for non-hierarchical datasets, alternative visualizations may be more suitable.

## Tree Map Example

![Tree Map Example](/Illustry-monorepo/tree-map.gif)