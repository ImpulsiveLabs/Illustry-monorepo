import { describe, test, expect } from 'vitest';
import {
    computeMaxDepth,
    computeCategories,
    computeNodesHierarchy,
    createLevels,
    calculateMeanValue,
    computeUniqueValues,
} from '../../../../src/lib/visualizations/hierarchy-charts/helper';
import { VisualizationTypes, TransformerTypes } from '@illustry/types';

describe('computeMaxDepth', () => {
    test('computes max depth for single node without children', () => {
        const nodes: VisualizationTypes.HierarchyNode[] = [
            { name: 'n1', value: 10, category: 'cat1' },
        ];
        console.log(nodes)
        expect(computeMaxDepth(nodes)).toBe(1);
    });

    test('computes max depth for nested nodes', () => {
        const nodes: VisualizationTypes.HierarchyNode[] = [
            {
                name: 'n1',
                value: 10,
                category: 'cat1',
                children: [
                    {
                        name: 'n2',
                        value: 20,
                        category: 'cat2',
                        children: [{ name: 'n3', value: 30, category: 'cat3' }],
                    },
                ],
            },
        ];
        expect(computeMaxDepth(nodes)).toBe(3);
    });

    test('handles empty array', () => {
        expect(computeMaxDepth([])).toBe(0);
    });

    test('handles nodes with empty children', () => {
        const nodes: VisualizationTypes.HierarchyNode[] = [
            { name: 'n1', value: 10, category: 'cat1', children: [] },
        ];
        expect(computeMaxDepth(nodes)).toBe(0);
    });

    test('handles undefined children', () => {
        const nodes: VisualizationTypes.HierarchyNode[] = [
            { name: 'n1', value: 10, category: 'cat1', children: undefined },
        ];
        expect(computeMaxDepth(nodes)).toBe(1);
    });
});

// describe('computeCategories', () => {
//     test('extracts unique categories from hierarchy', () => {
//         const nodes: VisualizationTypes.HierarchyNode[] = [
//             {
//                 name: 'n1',
//                 value: 10,
//                 category: 'cat1',
//                 children: [
//                     { name: 'n2', value: 20, category: 'cat2' },
//                     { name: 'n3', value: 30, category: 'cat1' },
//                 ],
//             },
//         ];
//         expect(computeCategories(nodes)).toEqual(['cat1', 'cat2']);
//     });

//     test('handles empty array', () => {
//         expect(computeCategories([])).toEqual([]);
//     });

//     test('handles undefined category', () => {
//         const nodes: VisualizationTypes.HierarchyNode[] = [
//             { name: 'n1', value: 10, category: undefined, children: [] } as any,
//         ];
//         expect(computeCategories(nodes)).toEqual([undefined]);
//     });

//     test('handles undefined children', () => {
//         const nodes: VisualizationTypes.HierarchyNode[] = [
//             { name: 'n1', value: 10, category: 'cat1', children: undefined },
//         ];
//         expect(computeCategories(nodes)).toEqual(['cat1']);
//     });
// });

// describe('computeNodesHierarchy', () => {
//     test('processes hierarchy with valid inputs', () => {
//         const nodes: VisualizationTypes.HierarchyNode[] = [
//             {
//                 name: 'n1',
//                 value: 10,
//                 category: 'cat1',
//                 properties: { key: 'val' },
//                 children: [
//                     { name: 'n2', value: 20, category: 'cat2', properties: 'prop' },
//                 ],
//             },
//         ];
//         const categories = ['cat1', 'cat2'];
//         const colors = ['#FF0000', '#00FF00'];
//         const result = computeNodesHierarchy(nodes, categories, colors);
//         expect(result).toEqual([
//             {
//                 name: 'n1',
//                 value: 10,
//                 itemStyle: { color: '#FF0000', borderColor: '#FF0000' },
//                 prop: '<div style="font-weight: bold">key:val</div><div style="font-weight: bold">value:10</div>',
//                 children: [
//                     {
//                         name: 'n2',
//                         value: 20,
//                         itemStyle: { color: '#00FF00', borderColor: '#00FF00' },
//                         prop: 'prop<div style="font-weight: bold">value:20</div>',
//                         children: [],
//                     },
//                 ],
//             },
//         ]);
//     });

//     test('handles empty inputs', () => {
//         expect(computeNodesHierarchy([], [], [])).toEqual([]);
//     });

//     test('handles undefined category', () => {
//         const nodes: VisualizationTypes.HierarchyNode[] = [
//             { name: 'n1', value: 10, category: undefined } as any,
//         ];
//         const result = computeNodesHierarchy(nodes, ['cat1'], ['#FF0000']);
//         expect(result).toEqual([
//             {
//                 name: 'n1',
//                 value: 10,
//                 itemStyle: { color: undefined, borderColor: undefined },
//                 children: [],
//             },
//         ]);
//     });

//     test('handles undefined properties', () => {
//         const nodes: VisualizationTypes.HierarchyNode[] = [
//             { name: 'n1', value: 10, category: 'cat1' },
//         ];
//         const result = computeNodesHierarchy(nodes, ['cat1'], ['#FF0000']);
//         expect(result).toEqual([
//             {
//                 name: 'n1',
//                 value: 10,
//                 itemStyle: { color: '#FF0000', borderColor: '#FF0000' },
//                 children: [],
//             },
//         ]);
//     });

//     test('handles undefined children', () => {
//         const nodes: VisualizationTypes.HierarchyNode[] = [
//             { name: 'n1', value: 10, category: 'cat1', children: undefined },
//         ];
//         const result = computeNodesHierarchy(nodes, ['cat1'], ['#FF0000']);
//         expect(result).toEqual([
//             {
//                 name: 'n1',
//                 value: 10,
//                 itemStyle: { color: '#FF0000', borderColor: '#FF0000' },
//                 children: [],
//             },
//         ]);
//     });
// });

// describe('createLevels', () => {
//     test('creates levels for positive number', () => {
//         const result = createLevels(2);
//         expect(result).toEqual([
//             {
//                 itemStyle: {
//                     borderWidth: 4,
//                     gapWidth: 4,
//                 },
//             },
//             {
//                 colorSaturation: [0.3, 0.5],
//                 itemStyle: {
//                     borderColor: '#555',
//                     borderColorSaturation: 0,
//                     borderWidth: 2,
//                     gapWidth: 2,
//                 },
//             },
//         ]);
//     });

//     test('handles zero', () => {
//         expect(createLevels(0)).toEqual([]);
//     });

//     test('handles single level', () => {
//         const result = createLevels(1);
//         expect(result).toEqual([
//             {
//                 colorSaturation: [0.3, 0.5],
//                 itemStyle: {
//                     borderColor: '#555',
//                     borderColorSaturation: 0,
//                     borderWidth: 2,
//                     gapWidth: 2,
//                 },
//             },
//         ]);
//     });
// });

// describe('calculateMeanValue', () => {
//     test('calculates mean of numbers', () => {
//         const numbers = [10, 20, 30];
//         expect(calculateMeanValue(numbers)).toBe(20);
//     });

//     test('handles empty array', () => {
//         expect(calculateMeanValue([])).toBe(0);
//     });

//     test('handles single number', () => {
//         expect(calculateMeanValue([42])).toBe(42);
//     });

//     test('handles zero values', () => {
//         expect(calculateMeanValue([0, 0])).toBe(0);
//     });
// });

// describe('computeUniqueValues', () => {
//     test('extracts unique values from hierarchy', () => {
//         const nodes: VisualizationTypes.HierarchyNode[] = [
//             {
//                 name: 'n1',
//                 value: 10,
//                 category: 'cat1',
//                 children: [
//                     { name: 'n2', value: 20, category: 'cat2' },
//                     { name: 'n3', value: 10, category: 'cat3' },
//                 ],
//             },
//         ];
//         expect(computeUniqueValues(nodes)).toEqual([10, 20]);
//     });

//     test('handles empty array', () => {
//         expect(computeUniqueValues([])).toEqual([]);
//     });

//     test('handles undefined value', () => {
//         const nodes: VisualizationTypes.HierarchyNode[] = [
//             { name: 'n1', value: undefined, category: 'cat1', children: [] } as any,
//         ];
//         expect(computeUniqueValues(nodes)).toEqual([undefined]);
//     });

//     test('handles undefined children', () => {
//         const nodes: VisualizationTypes.HierarchyNode[] = [
//             { name: 'n1', value: 10, category: 'cat1', children: undefined },
//         ];
//         expect(computeUniqueValues(nodes)).toEqual([10]);
//     });
// });