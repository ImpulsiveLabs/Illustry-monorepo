---
title: Matrix
description: Matrix doc
---

The **Matrix** visualization is a multi dimensional visualizations, where nodes of 2 categories can be visualized as complementary one with the other

## Matrix Data Structure

To represent a Matrix, you can use the following `NodeLinkData` interface:

```typescript
{{Node}}

{{Link}}

{{NodeLinkData}}
```
### Key Attributes

- **name:** A unique identifier for the node.
- **category:** Categorizes the node into a specific group or cluster.
- **labels:** Are an array of name values that represent specific attributes of the node.
- **source:** Identifies the source node of the link.
- **target:** Identifies the target node of the link.
- **value:** Represents a numerical value associated with the link that suggests how strongly connected the nodes are.

### Pros and Cons

#### Pros
- **Large Data:** Very large amount of data can be displayed on a single window.

- **Filtering:** Filtering on the rows and on the columns.

#### Cons
- **Scroll needed:** Too many data could need a scroll in order to see them all.


## Matrix Example

![Matrix Example](/Illustry-monorepo/matrix.gif)