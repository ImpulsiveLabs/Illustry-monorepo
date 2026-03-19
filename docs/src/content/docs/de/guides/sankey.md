---
title: Sankey-Diagramm
description: Sankey
---

The **Sankey Diagram** visualization is a powerful tool for visualizing flow and relationships between entities in a dataset. It is particularly useful for showcasing the distribution and transformation of values across a system or process.

## Sankey Diagram Data Structure

To represent a Sankey Diagram, you can use the following `NodeLinkData` interface:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Key Attributes

- **name:** A unique identifier for the node.
- **category:** Categorizes the node into a specific group or cluster.
- **source:** Identifies the source node of the link.
- **target:** Identifies the target node of the link.
- **value:** Represents a numerical value associated with the link that suggests how strongly connected the nodes are.

### Pros and Cons

#### Pros
- **Flow Representation:** Effectively visualizes the flow of values or quantities between entities in a system or process.

- **Insight into Distribution:** Offers insights into how values are distributed and transformed at each stage.

#### Cons
- **Complexity with Numerous Nodes:** Visual clutter may occur with an extensive number of nodes, affecting readability.

- **Specialized Use Case:** Primarily designed for visualizing flow and distribution; may not be suitable for all types of datasets.

## Sankey Diagram Example

![Sankey Diagram Example](/Illustry-monorepo/sankey.gif)