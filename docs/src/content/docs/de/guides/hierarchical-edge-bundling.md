---
title: Hierarchisches Edge-Bundling
description: Hierarchical Edge Bundling doc
---

The **Hierarchical Edge Bundling** visualization is a sophisticated technique for depicting hierarchical relationships and connections within a dataset. It leverages edge bundling to reduce visual clutter while highlighting the structure of relationships in a hierarchical manner.

## Hierarchical Edge Bundling Data Structure

To represent a Hierarchical Edge Bundling, you can use the following `NodeLinkData` interface:

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
- **Improved Aesthetics and Readability:** The bundled edges contribute to a cleaner and more aesthetically pleasing visualization. By reducing visual clutter, users can more easily interpret the relationships between nodes, enhancing overall readability.

- **Enhanced Focus on Key Relationships:** Edge bundling allows users to focus on key relationships within the hierarchical structure, emphasizing the most significant connections. This can aid in identifying critical paths or central nodes in complex datasets.

#### Cons
- **Difficulty in Identifying Parallel Paths:** Identifying parallel paths or connections in a densely bundled area may pose challenges for users. Distinguishing between closely packed edges representing different relationships can be complex, affecting the precision of analysis.

- **Challenges with Directionality Perception:** Users may face difficulties in perceiving the directionality of bundled edges, particularly in scenarios where there is a high degree of overlap. This can impact the accurate interpretation of the flow of relationships.

## Hierarchical Edge Bundling Example

![Hierarchical Edge Bundling Example](/Illustry-monorepo/hierarchical-edge-bundling.gif)