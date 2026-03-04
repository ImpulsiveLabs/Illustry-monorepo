import { describe, it, expect } from 'vitest';
import {
  computeMaxDepth,
  computeCategories,
  computeNodesHierarchy,
  createLevels,
  calculateMeanValue,
  computeUniqueValues
} from '../../../../src/lib/visualizations/hierarchy-charts/helper';
import { VisualizationTypes } from '@illustry/types';

describe('hierarchy helpers', () => {
  it('computes max depth across nested trees', () => {
    const nodes: VisualizationTypes.HierarchyNode[] = [
      {
        name: 'root',
        value: 10,
        category: 'a',
        children: [
          {
            name: 'child',
            value: 20,
            category: 'b',
            children: [{ name: 'leaf', value: 30, category: 'c' }]
          }
        ]
      }
    ];

    expect(computeMaxDepth(nodes)).toBe(3);
    expect(computeMaxDepth([])).toBe(0);
    expect(computeMaxDepth([{ name: 'only', value: 1, category: 'x', children: [] }])).toBe(0);
  });

  it('extracts unique categories recursively', () => {
    const nodes: VisualizationTypes.HierarchyNode[] = [
      {
        name: 'r1',
        value: 1,
        category: 'cat-1',
        children: [
          { name: 'c1', value: 2, category: 'cat-2' },
          { name: 'c2', value: 3, category: 'cat-1' }
        ]
      },
      { name: 'r2', value: 4, category: 'cat-3' }
    ];

    expect(computeCategories(nodes)).toEqual(['cat-1', 'cat-2', 'cat-3']);
  });

  it('builds hierarchy nodes with mapped styles and tooltip props', () => {
    const nodes: VisualizationTypes.HierarchyNode[] = [
      {
        name: 'parent',
        value: 10,
        category: 'cat-1',
        properties: { key: 'value' },
        children: [
          {
            name: 'child',
            value: 20,
            category: 'cat-2',
            properties: 'plain-text'
          }
        ]
      },
      {
        name: 'orphan',
        value: 30,
        category: 'missing-cat'
      }
    ];

    const result = computeNodesHierarchy(nodes, ['cat-1', 'cat-2'], ['#f00', '#0f0']);

    expect(result[0]).toMatchObject({
      name: 'parent',
      value: 10,
      itemStyle: { color: '#f00', borderColor: '#f00' },
      prop: '<div style="font-weight: bold">key:value</div><div style="font-weight: bold">value:10</div>'
    });
    expect(result[0]?.children[0]).toMatchObject({
      name: 'child',
      value: 20,
      itemStyle: { color: '#0f0', borderColor: '#0f0' },
      prop: 'plain-text<div style="font-weight: bold">value:20</div>'
    });
    expect(result[1]).toMatchObject({
      name: 'orphan',
      value: 30,
      itemStyle: { color: undefined, borderColor: undefined }
    });
  });

  it('creates level styling metadata', () => {
    const levels = createLevels(3);
    expect(levels).toHaveLength(3);
    expect(levels[0]).toMatchObject({
      colorSaturation: undefined,
      itemStyle: { borderColor: '#555', borderWidth: 6, gapWidth: 6 }
    });
    expect(levels[2]).toMatchObject({
      colorSaturation: [0.3, 0.5],
      itemStyle: { borderColor: undefined, borderWidth: 2, gapWidth: 2 }
    });
    expect(createLevels(0)).toEqual([]);
  });

  it('calculates means and unique values', () => {
    expect(calculateMeanValue([2, 4, 6])).toBe(4);
    expect(calculateMeanValue([])).toBe(0);

    const nodes: VisualizationTypes.HierarchyNode[] = [
      {
        name: 'root',
        value: 10,
        category: 'x',
        children: [
          { name: 'c1', value: 15, category: 'y' },
          { name: 'c2', value: 10, category: 'z' }
        ]
      }
    ];

    expect(computeUniqueValues(nodes)).toEqual([10, 15]);
    expect(computeUniqueValues([])).toEqual([]);
  });
});
