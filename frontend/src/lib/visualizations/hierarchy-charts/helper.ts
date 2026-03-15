import { TransformerTypes, VisualizationTypes } from '@illustry/types';

// TreeMap/Sunburst

const findMaxDepth = (item: VisualizationTypes.HierarchyNode, depth: number, maxDepth: number): number => {
  let finalMaxDepth = maxDepth;
  if (Array.isArray(item.children)) {
    // If the 'children' property is an array, recursively find the maximum depth
    item.children.forEach((nestedItem) => {
      finalMaxDepth = findMaxDepth(nestedItem, depth + 1, maxDepth);
    });
  } else {
    // If there are no children or 'children' is not an array, update maxDepth if needed
    finalMaxDepth = Math.max(maxDepth, depth);
  }
  return finalMaxDepth; // Return the updated maxDepth
};

const computeMaxDepth = (arr: VisualizationTypes.HierarchyNode[]): number => {
  let maxDepth = 0;

  arr.forEach((item) => {
    // For each TreeMapNode in the array, call findMaxDepth to compute depth
    maxDepth = findMaxDepth(item, 1, maxDepth);
  });

  return maxDepth;
};

const computeCategories = (arr: VisualizationTypes.HierarchyNode[]): string[] => {
  const uniqueCategories = new Set<string>();

  function extractCategories(item: VisualizationTypes.HierarchyNode) {
    const { category, children } = item;
    uniqueCategories.add(category); // Add the category to the Set

    if (children) {
      // Recursively extract categories from children
      children.forEach((child) => extractCategories(child));
    }
  }

  arr.forEach((item) => {
    extractCategories(item); // Start extraction for each TreeMapNode
  });

  return Array.from(uniqueCategories); // Convert Set to an array
};

const computePropertiesForToolTip = (
  properties: Record<string, string | number> | string,
  value?: number | string
) => {
  let prop = '';

  if (typeof properties === 'object') {
    Object.entries(properties).forEach(([key, propValue]) => {
      prop += `<div style="font-weight: bold">${key}:${propValue}</div>`;
    });

    if (value) {
      prop += `<div style="font-weight: bold">value:${value}</div>`;
    }
  } else if (typeof properties === 'string') {
    if (value) {
      prop
        += `${properties}<div style="font-weight: bold">value:${value}</div>`;
    } else {
      prop += properties;
    }
  }

  return prop;
};

const computeNodesHierarchy = (
  nodes: VisualizationTypes.HierarchyNode[],
  categories: string[],
  colors: string[]
) => {
  const colorMapSchema = new Map<string, string>();
  categories.forEach((cat, index) => {
    colorMapSchema.set(cat, colors[index] as string);
  });
  const processNode = (node: VisualizationTypes.HierarchyNode) => {
    const {
      name, value, category, properties, children
    } = node;
    const processedNode: TransformerTypes.NodeWithStyling = {
      name,
      value,
      itemStyle: {
        color: colorMapSchema.get(category),
        borderColor: colorMapSchema.get(category)
      },
      children: []
    };
    if (properties) {
      processedNode.prop = computePropertiesForToolTip(properties as string | Record<string, string | number>, value);
    }
    if (children) {
      processedNode.children = children.map(processNode); // Recursively process children
    }

    return processedNode;
  };

  return nodes.map(processNode);
};

const createLevels = (nr: number) => {
  const levels = [];

  for (let i = nr; i > 0; i -= 1) {
    const borderWidth = 2 * i;
    const gapWidth = 2 * i;
    const style = {
      colorSaturation: i === nr ? undefined : [0.3, 0.5],
      itemStyle: {
        borderColor: i === nr ? '#555' : undefined,
        borderColorSaturation: 1 - (i % 10),
        borderWidth,
        gapWidth
      }
    };
    levels.push(style);
  }

  return levels;
};

const calculateMeanValue = (numbers: number[]) => {
  if (numbers.length === 0) {
    return 0;
  }

  const sum = numbers.reduce((total, num) => total + num, 0);
  const mean = sum / numbers.length;

  return mean;
};

const computeUniqueValues = (arr: VisualizationTypes.HierarchyNode[]): number[] => {
  const uniqueCategories = new Set<number>();

  function extractValues(item: VisualizationTypes.HierarchyNode) {
    const { value, children } = item;
    uniqueCategories.add(value); // Add the category to the Set

    if (children) {
      // Recursively extract categories from children
      children.forEach((child) => extractValues(child));
    }
  }

  arr.forEach((item) => {
    extractValues(item); // Start extraction for each TreeMapNode
  });

  return Array.from(uniqueCategories); // Convert Set to an array
};

export {
  computeMaxDepth, computeCategories, computeNodesHierarchy, createLevels, calculateMeanValue, computeUniqueValues
};
