import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
    computeCategoriesSankey,
    computeNodesSankey,
    computeLinksSankey,
    sortColumns,
    sortRows,
    addStyleTooltipWithHover,
    createHeadersAndPropertiesString,
    computeCategoriesFLGOrHEB,
    computeNodesHEB,
    computeLinksFLGOrHEB,
    computeNodesFLG,
    categoryMap,
} from '../../../../src/lib/visualizations/node-link/helper';
import { VisualizationTypes, TransformerTypes } from '@illustry/types';

beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
});

describe('computeCategoriesSankey', () => {
    test('returns unique categories', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: 'cat1' },
            { name: 'n2', category: 'cat2' },
            { name: 'n3', category: 'cat1' },
        ];
        expect(computeCategoriesSankey(nodes)).toEqual(['cat1', 'cat2']);
    });

    test('handles empty nodes', () => {
        expect(computeCategoriesSankey([])).toEqual([]);
    });

    test('handles undefined category', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: undefined } as any,
            { name: 'n2', category: 'cat1' },
        ];
        expect(computeCategoriesSankey(nodes)).toEqual([undefined, 'cat1']);
    });
});

describe('computeNodesSankey', () => {
    test('computes nodes with valid inputs', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: 'cat1', properties: { key: 'val' } },
        ];
        const categories = ['cat1'];
        const colors = ['#FF0000'];
        const result = computeNodesSankey(nodes, categories, colors);
        expect(result).toEqual([
            {
                name: 'n1',
                itemStyle: { color: '#FF0000', borderColor: '#FF0000' },
                prop: '<div style="font-weight: bold">key:val</div>',
            },
        ]);
    });

    test('handles empty inputs', () => {
        expect(computeNodesSankey([], [], [])).toEqual([]);
    });

    test('handles undefined category', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: undefined, properties: { key: 'val' } } as any,
        ];
        const result = computeNodesSankey(nodes, ['cat1'], ['#FF0000']);
        expect(result).toEqual([
            {
                name: 'n1',
                itemStyle: { color: undefined, borderColor: undefined },
                prop: '<div style="font-weight: bold">key:val</div>',
            },
        ]);
    });

    test('handles undefined properties', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: 'cat1' },
        ];
        const result = computeNodesSankey(nodes, ['cat1'], ['#FF0000']);
        expect(result).toEqual([
            {
                name: 'n1',
                itemStyle: { color: '#FF0000', borderColor: '#FF0000' },
            },
        ]);
    });
});

describe('computeLinksSankey', () => {
    test('computes links with valid inputs', () => {
        const links: VisualizationTypes.Link[] = [
            { source: 'n1', target: 'n2', value: 10, properties: { key: 'val' } },
        ];
        const result = computeLinksSankey(links);
        expect(result).toEqual([
            {
                source: 'n1',
                target: 'n2',
                value: 10,
                prop: '<div style="font-weight: bold">key:val</div><div style="font-weight: bold">value:10</div>',
            },
        ]);
    });

    test('handles empty links', () => {
        expect(computeLinksSankey([])).toEqual([]);
    });

    test('handles undefined properties', () => {
        const links: VisualizationTypes.Link[] = [
            { source: 'n1', target: 'n2', value: 10 },
        ];
        const result = computeLinksSankey(links);
        expect(result).toEqual([
            { source: 'n1', target: 'n2', value: 10 },
        ]);
    });
});

// describe('sortColumns', () => {
//     beforeEach(() => {
//         document.body.innerHTML = `
//       <table id="myTable">
//         <tr>
//           <td class="sortableCol" right-data-sort-direction="asc">Col1</td>
//         </tr>
//       </table>
//     `;
//     });

//     test('adds click listeners and toggles sort direction', () => {
//         sortColumns();
//         const col = document.querySelector('.sortableCol')!;
//         col.dispatchEvent(new MouseEvent('click'));
//         expect(globalThis.sortUpperTable).toHaveBeenCalledWith(1, 'desc');
//         expect(col.getAttribute('right-data-sort-direction')).toBe('desc');
//         col.dispatchEvent(new MouseEvent('click'));
//         expect(globalThis.sortUpperTable).toHaveBeenCalledWith(1, 'asc');
//     });

//     test('handles no sortable columns', () => {
//         document.body.innerHTML = '<table id="myTable"></table>';
//         expect(() => sortColumns()).not.toThrow();
//     });
// });

// describe('sortRows', () => {
//     beforeEach(() => {
//         document.body.innerHTML = `
//       <table id="myTable">
//         <tr>
//           <td class="sortableRow" left-data-sort-direction="asc">Row1</td>
//         </tr>
//       </table>
//     `;
//         vi.spyOn(globalThis, 'sortLowerTable');
//     });

//     test('adds click listeners and toggles sort direction', () => {
//         sortRows();
//         const row = document.querySelector('.sortableRow')!;
//         row.dispatchEvent(new MouseEvent('click'));
//         expect(globalThis.sortLowerTable).toHaveBeenCalledWith(0, 'desc');
//         expect(row.getAttribute('left-data-sort-direction')).toBe('desc');
//         row.dispatchEvent(new MouseEvent('click'));
//         expect(globalThis.sortLowerTable).toHaveBeenCalledWith(0, 'asc');
//     });

//     test('handles no sortable rows', () => {
//         document.body.innerHTML = '<table id="myTable"></table>';
//         expect(() => sortRows()).not.toThrow();
//     });
// });

// describe('addStyleTooltipWithHover', () => {
//     beforeEach(() => {
//         document.body.innerHTML = `
//       <div class="right-sortable-items">
//         <span class="tooltip">Tooltip</span>
//       </div>
//       <div class="left-sortable-items">
//         <span class="tooltip">Tooltip2</span>
//       </div>
//     `;
//     });

//     test('adds hover events to show/hide tooltip', () => {
//         addStyleTooltipWithHover();
//         const item1 = document.querySelector('.right-sortable-items')!;
//         const item2 = document.querySelector('.left-sortable-items')!;
//         const tooltip1: any = item1.querySelector('.tooltip')!;
//         const tooltip2: any = item2.querySelector('.tooltip')!;
//         expect(tooltip1.style.visibility).toBe('hidden');
//         expect(tooltip2.style.visibility).toBe('hidden');
//         item1.dispatchEvent(new MouseEvent('mouseover'));
//         expect(tooltip1.style.visibility).toBe('visible');
//         item1.dispatchEvent(new MouseEvent('mouseout'));
//         expect(tooltip1.style.visibility).toBe('hidden');
//         item2.dispatchEvent(new MouseEvent('mouseover'));
//         expect(tooltip2.style.visibility).toBe('visible');
//         item2.dispatchEvent(new MouseEvent('mouseout'));
//         expect(tooltip2.style.visibility).toBe('hidden');
//     });

//     test('handles no tooltips', () => {
//         document.body.innerHTML = '<div class="right-sortable-items"></div>';
//         expect(() => addStyleTooltipWithHover()).not.toThrow();
//     });

//     test('handles no sortable items', () => {
//         document.body.innerHTML = '';
//         expect(() => addStyleTooltipWithHover()).not.toThrow();
//     });
// });

// describe('createHeadersAndPropertiesString', () => {
//     test('creates table with valid inputs', () => {
//         const group1: VisualizationTypes.Node[] = [
//             {
//                 name: 'n1',
//                 labels: [{ name: 'label1', value: 10, properties: { key: 'val' } }] ,
//             } as any,
//         ];
//         const group2: VisualizationTypes.Node[] = [
//             {
//                 name: 'n2',
//                 labels: [{ name: 'label2', value: 20, properties: { key: 'val2' } }],
//             } as any,
//         ];
//         const links: VisualizationTypes.Link[] = [
//             { source: 'n1', target: 'n2', value: 30, properties: { key: 'link' } },
//         ];
//         const result = createHeadersAndPropertiesString(group1, group2, links);
//         expect(result).toContain('label1');
//         expect(result).toContain('label2');
//         expect(result).toContain('n1');
//         expect(result).toContain('n2');
//         expect(result).toContain('10');
//         expect(result).toContain('20');
//         expect(result).toContain('30');
//         expect(result).toContain('key:val');
//         expect(result).toContain('key:val2');
//         expect(result).toContain('key:link');
//     });

//     test('handles empty inputs', () => {
//         const result = createHeadersAndPropertiesString([], [], []);
//         expect(result).toContain('<thead><tr id="header" ><th> </th></tr></thead><tbody></tbody>');
//     });

//     test('handles undefined labels', () => {
//         const group1: VisualizationTypes.Node[] = [
//             { name: 'n1', labels: undefined } as any,
//         ];
//         const group2: VisualizationTypes.Node[] = [
//             { name: 'n2', labels: undefined } as any,
//         ];
//         const result = createHeadersAndPropertiesString(group1, group2, []);
//         expect(result).toContain('n1');
//         expect(result).toContain('n2');
//         expect(result).toContain('<td class="right-sortable-items left-sortable-items"');
//     });

//     test('handles undefined properties', () => {
//         const group1: VisualizationTypes.Node[] = [
//             { name: 'n1', labels: [{ name: 'label1', value: 10 }] } as any,
//         ];
//         const group2: VisualizationTypes.Node[] = [
//             { name: 'n2', labels: [{ name: 'label2', value: 20 }] } as any,
//         ];
//         const links: VisualizationTypes.Link[] = [
//             { source: 'n1', target: 'n2', value: 30 },
//         ];
//         const result = createHeadersAndPropertiesString(group1, group2, links);
//         expect(result).toContain('10');
//         expect(result).toContain('20');
//         expect(result).toContain('30');
//     });
// });

// describe('computeCategoriesFLGOrHEB', () => {
//     test('computes categories with valid inputs', () => {
//         const nodes: VisualizationTypes.Node[] = [
//             { name: 'n1', category: 'cat1' },
//             { name: 'n2', category: 'cat2' },
//             { name: 'n3', category: 'cat1' },
//         ];
//         const colors = ['#FF0000', '#00FF00'];
//         const result = computeCategoriesFLGOrHEB(nodes, colors);
//         expect(result).toEqual([
//             { name: 'cat1', itemStyle: { color: '#FF0000' } },
//             { name: 'cat2', itemStyle: { color: '#00FF00' } },
//         ]);
//     });

//     test('handles empty inputs', () => {
//         expect(computeCategoriesFLGOrHEB([], [])).toEqual([]);
//     });

//     test('handles undefined category', () => {
//         const nodes: VisualizationTypes.Node[] = [
//             { name: 'n1', category: undefined },
//             { name: 'n2', category: 'cat1' },
//         ];
//         const result = computeCategoriesFLGOrHEB(nodes, ['#FF0000', '#00FF00']);
//         expect(result).toEqual([
//             { name: undefined, itemStyle: { color: '#FF0000' } },
//             { name: 'cat1', itemStyle: { color: '#00FF00' } },
//         ]);
//     });

//     test('handles fewer colors than categories', () => {
//         const nodes: VisualizationTypes.Node[] = [
//             { name: 'n1', category: 'cat1' },
//             { name: 'n2', category: 'cat2' },
//         ];
//         const result = computeCategoriesFLGOrHEB(nodes, ['#FF0000']);
//         expect(result).toEqual([
//             { name: 'cat1', itemStyle: { color: '#FF0000' } },
//             { name: 'cat2', itemStyle: { color: undefined } },
//         ]);
//     });
// });

describe('computeNodesHEB', () => {
    test('computes nodes with valid inputs', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: 'cat1', properties: { key: 'val' } },
        ];
        const categories = [{ name: 'cat1', itemStyle: { color: '#FF0000' } }];
        const result = computeNodesHEB(nodes, categories);

        expect(result).toEqual([
            {
                name: 'n1',
                category: 'cat1',
                properties: { key: 'val' },
                id: 'n1',
                label: { show: true, color: '#FF0000' },
                symbolSize: '',
                prop: '<div style="font-weight: bold">key:val</div>'
            },
        ]);
    });

    test('handles empty inputs', () => {
        expect(computeNodesHEB([], [])).toEqual([]);
    });

    test('handles undefined category', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: undefined } as any,
        ];
        const result = computeNodesHEB(nodes, []);
        expect(result).toEqual([
            {
                name: 'n1',
                category: undefined,
                id: 'n1',
                label: { show: true, color: '#000' },
                symbolSize: '',
            },
        ]);
    });

    test('handles missing category in categories', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: 'cat1' },
        ];
        const result = computeNodesHEB(nodes, []);
        expect(result).toEqual([
            {
                name: 'n1',
                category: 'cat1',
                id: 'n1',
                label: { show: true, color: '#000' },
                symbolSize: '',
            },
        ]);
    });

    test('handles undefined properties', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: 'cat1' },
        ];
        const categories = [{ name: 'cat1', itemStyle: { color: '#FF0000' } }];
        const result = computeNodesHEB(nodes, categories);
        expect(result).toEqual([
            {
                name: 'n1',
                category: 'cat1',
                id: 'n1',
                label: { show: true, color: '#FF0000' },
                symbolSize: '',
            },
        ]);
    });
});

describe('computeLinksFLGOrHEB', () => {
    test('computes links with valid inputs', () => {
        const links: VisualizationTypes.Link[] = [
            { source: 'n1', target: 'n2', value: 10, properties: { key: 'val' } },
        ];
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1' },
            { name: 'n2' },
        ];
        const result = computeLinksFLGOrHEB(links, nodes);
        expect(result).toEqual([
            {
                source: 0,
                target: 1,
                value: 10,
                prop: '<div style="font-weight: bold">key:val</div><div style="font-weight: bold">value:10</div>',
            },
        ]);
    });

    test('handles empty inputs', () => {
        expect(computeLinksFLGOrHEB([], [])).toEqual([]);
    });

    test('handles missing nodes', () => {
        const links: VisualizationTypes.Link[] = [
            { source: 'n1', target: 'n2', value: 10 },
        ];
        const result = computeLinksFLGOrHEB(links, []);
        expect(result).toEqual([
            { source: -1, target: -1, value: 10 },
        ]);
    });

    test('handles undefined properties', () => {
        const links: VisualizationTypes.Link[] = [
            { source: 'n1', target: 'n2', value: 10 },
        ];
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1' },
            { name: 'n2' },
        ];
        const result = computeLinksFLGOrHEB(links, nodes);
        expect(result).toEqual([
            { source: 0, target: 1, value: 10 },
        ]);
    });
});

describe('computeNodesFLG', () => {
    test('computes nodes with valid inputs', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: 'cat1', properties: { key: 'val' } },
        ];
        const categories = [{ name: 'cat1' }];
        const result = computeNodesFLG(nodes, categories);
        expect(result).toEqual([
            {
                id: '0',
                name: 'n1',
                category: 0,
                prop: '<div style="font-weight: bold">key:val</div>',
            },
        ]);
    });

    test('handles empty inputs', () => {
        expect(computeNodesFLG([], [])).toEqual([]);
    });

    test('handles undefined category', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: undefined } as any,
        ];
        const categories = [{ name: 'cat1' }];
        const result = computeNodesFLG(nodes, categories);
        expect(result).toEqual([
            { id: '0', name: 'n1', category: -1 },
        ]);
    });

    test('handles undefined properties', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: 'cat1' },
        ];
        const categories = [{ name: 'cat1' }];
        const result = computeNodesFLG(nodes, categories);
        expect(result).toEqual([
            { id: '0', name: 'n1', category: 0 },
        ]);
    });
});

describe('categoryMap', () => {
    test('maps nodes by category', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: 'cat1' },
            { name: 'n2', category: 'cat2' },
            { name: 'n3', category: 'cat1' },
        ];
        const result = categoryMap(nodes);
        expect(result).toEqual({
            cat1: [{ name: 'n1', category: 'cat1' }, { name: 'n3', category: 'cat1' }],
            cat2: [{ name: 'n2', category: 'cat2' }],
        });
    });

    test('handles empty nodes', () => {
        expect(categoryMap([])).toEqual({});
    });

    test('handles undefined category', () => {
        const nodes: VisualizationTypes.Node[] = [
            { name: 'n1', category: undefined },
            { name: 'n2', category: 'cat1' },
        ];
        const result = categoryMap(nodes);
        expect(result).toEqual({
            undefined: [{ name: 'n1', category: undefined }],
            cat1: [{ name: 'n2', category: 'cat1' }],
        });
    });
});