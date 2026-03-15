import { describe, it, expect, beforeEach, vi } from 'vitest';
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
  categoryMap
} from '../../../../src/lib/visualizations/node-link/helper';
import { VisualizationTypes } from '@illustry/types';

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('node-link helpers', () => {
  it('computes sankey categories and styled nodes', () => {
    const nodes: VisualizationTypes.Node[] = [
      { name: 'n1', category: 'cat-1', properties: { a: 1 } },
      { name: 'n2', category: 'cat-2', properties: 'meta' },
      { name: 'n3', category: 'cat-1' }
    ];

    expect(computeCategoriesSankey(nodes)).toEqual(['cat-1', 'cat-2']);

    const styled = computeNodesSankey(nodes, ['cat-1', 'cat-2'], ['#f00', '#0f0']);
    expect(styled[0]).toMatchObject({
      name: 'n1',
      itemStyle: { color: '#f00', borderColor: '#f00' },
      prop: '<div style="font-weight: bold">a:1</div>'
    });
    expect(styled[1]).toMatchObject({
      name: 'n2',
      itemStyle: { color: '#0f0', borderColor: '#0f0' },
      prop: 'meta'
    });
    expect(styled[2]).toMatchObject({
      name: 'n3',
      itemStyle: { color: '#f00', borderColor: '#f00' }
    });

    const numericPropertiesNode = computeNodesSankey(
      [{ name: 'n4', category: 'cat-1', properties: 1 as any }],
      ['cat-1'],
      ['#f00']
    );
    expect(numericPropertiesNode[0]).toMatchObject({
      name: 'n4',
      itemStyle: { color: '#f00', borderColor: '#f00' }
    });
    expect(numericPropertiesNode[0]?.prop).toBe('');
  });

  it('computes sankey links with optional tooltip payload', () => {
    const links: VisualizationTypes.Link[] = [
      { source: 'n1', target: 'n2', value: 5, properties: { p: 'x' } },
      { source: 'n2', target: 'n3', value: 9 }
    ];

    const result = computeLinksSankey(links);
    expect(result[0]).toMatchObject({
      source: 'n1',
      target: 'n2',
      value: 5,
      prop: '<div style="font-weight: bold">p:x</div><div style="font-weight: bold">value:5</div>'
    });
    expect(result[1]).toEqual({ source: 'n2', target: 'n3', value: 9 });
  });

  it('computes FLG/HEB categories and transformed nodes/links', () => {
    const nodes: VisualizationTypes.Node[] = [
      { name: 'A', category: 'left', properties: { info: '1' } },
      { name: 'B', category: 'right' }
    ];

    const categories = computeCategoriesFLGOrHEB(nodes, ['#123', '#456']);
    expect(categories).toEqual([
      { name: 'left', itemStyle: { color: '#123' } },
      { name: 'right', itemStyle: { color: '#456' } }
    ]);

    const hebNodes = computeNodesHEB(nodes, categories);
    expect(hebNodes[0]).toMatchObject({
      id: 'A',
      label: { show: true, color: '#123' },
      prop: '<div style="font-weight: bold">info:1</div>'
    });
    expect(hebNodes[1]).toMatchObject({ id: 'B', label: { show: true, color: '#456' } });

    const flgNodes = computeNodesFLG(nodes, categories);
    expect(flgNodes).toEqual([
      { id: '0', name: 'A', category: 0, prop: '<div style="font-weight: bold">info:1</div>' },
      { id: '1', name: 'B', category: 1 }
    ]);

    const links = computeLinksFLGOrHEB([
      { source: 'A', target: 'B', value: 2, properties: { weight: 'w' } },
      { source: 'unknown', target: 'B', value: 1 }
    ], nodes);

    expect(links[0]).toMatchObject({
      source: 0,
      target: 1,
      value: 2,
      prop: '<div style="font-weight: bold">weight:w</div><div style="font-weight: bold">value:2</div>'
    });
    expect(links[1]).toEqual({ source: -1, target: 1, value: 1 });
  });

  it('covers HEB fallback color and string link properties', () => {
    const nodes: VisualizationTypes.Node[] = [
      { name: 'A', category: 'missing' },
      { name: 'B', category: 'known' }
    ];
    const categories = [{ name: 'known', itemStyle: { color: '#123' } }];

    const hebNodes = computeNodesHEB(nodes, categories as any);
    expect(hebNodes[0]).toMatchObject({ id: 'A', label: { color: '#000' } });
    expect(hebNodes[1]).toMatchObject({ id: 'B', label: { color: '#123' } });

    const links = computeLinksFLGOrHEB([
      { source: 'A', target: 'B', value: 2, properties: 'meta' }
    ], nodes);
    expect(links[0]).toMatchObject({
      source: 0,
      target: 1,
      value: 2,
      prop: 'meta<div style="font-weight: bold">value:2</div>'
    });
  });

  it('maps nodes by category key', () => {
    const grouped = categoryMap([
      { name: 'a', category: 'one' },
      { name: 'b', category: 'two' },
      { name: 'c', category: 'one' }
    ]);

    expect(grouped).toEqual({
      one: [{ name: 'a', category: 'one' }, { name: 'c', category: 'one' }],
      two: [{ name: 'b', category: 'two' }]
    });
  });

  it('creates matrix table markup for headers, labels and links', () => {
    const group1: VisualizationTypes.Node[] = [
      {
        name: 'g1-node',
        category: 'g1',
        labels: [{ name: 'L1', value: 10, properties: { tip: { x: 'y' } } }]
      } as any
    ];
    const group2: VisualizationTypes.Node[] = [
      {
        name: 'g2-node',
        category: 'g2',
        labels: [{ name: 'R1', value: 20, properties: { style: { color: 'red' } } }],
        properties: { tip: { a: 'b' } }
      } as any
    ];
    const links: VisualizationTypes.Link[] = [
      { source: 'g1-node', target: 'g2-node', value: 33, properties: { tip: { link: 'yes' } } }
    ];

    const html = createHeadersAndPropertiesString(group1, group2, links);

    expect(html).toContain('<thead>');
    expect(html).toContain('g2-node');
    expect(html).toContain('g1-node');
    expect(html).toContain('L1');
    expect(html).toContain('R1');
    expect(html).toContain('33');
    expect(html).toContain('tooltip');
    expect(html).toContain('sortableCol');
    expect(html).toContain('sortableRow');
  });

  it('handles array-form matrix properties and missing links', () => {
    const group1: VisualizationTypes.Node[] = [
      {
        name: 'g1',
        category: 'a',
        labels: [
          {
            name: 'L',
            value: 1,
            properties: [{ tooltip: { a: 1 } }, { style: { color: 'blue' } }]
          }
        ]
      } as any
    ];
    const group2: VisualizationTypes.Node[] = [
      {
        name: 'g2',
        category: 'b',
        labels: [{ name: 'R', value: 2 }]
      } as any
    ];

    const html = createHeadersAndPropertiesString(group1, group2, []);
    expect(html).toContain('g1');
    expect(html).toContain('g2');
    expect(html).toContain('tooltip');
    expect(html).toContain('right-sortable-items');
  });

  it('builds matrix with multiple left labels and missing left-label cells', () => {
    const group1: VisualizationTypes.Node[] = [
      {
        name: 'g1-a',
        category: 'a',
        labels: [{ name: 'L1', value: 1 }]
      } as any,
      {
        name: 'g1-b',
        category: 'a',
        labels: [{ name: 'L2', value: 2 }]
      } as any
    ];
    const group2: VisualizationTypes.Node[] = [
      {
        name: 'g2-a',
        category: 'b',
        labels: [{ name: 'R1', value: 3 }]
      } as any
    ];

    const html = createHeadersAndPropertiesString(group1, group2, []);
    expect(html).toContain('L1');
    expect(html).toContain('L2');
    expect(html).toContain('R1');
    // Missing label cells are rendered as empty sortable left cells.
    expect(html).toContain('left-sortable-items');
  });

  it('builds matrix rows when links are reversed and labels are missing', () => {
    const group1: VisualizationTypes.Node[] = [
      { name: 'left', category: 'a' } as any
    ];
    const group2: VisualizationTypes.Node[] = [
      { name: 'right', category: 'b', labels: [{ name: 'R', value: 3 }] } as any
    ];
    const links: VisualizationTypes.Link[] = [
      { source: 'right', target: 'left', value: 5 }
    ];

    const html = createHeadersAndPropertiesString(group1, group2, links);
    expect(html).toContain('5');
    expect(html).toContain('left');
    expect(html).toContain('right');
  });

  it('handles group2 nodes without labels and string header properties', () => {
    const group1: VisualizationTypes.Node[] = [
      { name: 'left', category: 'a', labels: [{ name: 'L', value: 1 }] } as any
    ];
    const group2: VisualizationTypes.Node[] = [
      { name: 'right-a', category: 'b', properties: 'meta', labels: [{ name: 'R', value: 2 }] } as any,
      { name: 'right-b', category: 'b' } as any
    ];

    const html = createHeadersAndPropertiesString(group1, group2, []);
    expect(html).toContain('right-b');
    expect(html).toContain('right-sortable-items');
  });

  it('wires sortable column clicks and toggles direction', () => {
    document.body.innerHTML = `
      <table id="myTable">
        <tr>
          <td class="sortableCol" right-data-sort-direction="asc">H</td>
        </tr>
        <tr><td class="right-sortable-items"><span>2</span></td></tr>
        <tr><td class="right-sortable-items"><span>1</span></td></tr>
      </table>
    `;

    sortColumns();
    const col = document.querySelector('.sortableCol') as HTMLElement;

    col.click();
    expect(col.getAttribute('right-data-sort-direction')).toBe('desc');
    col.click();
    expect(col.getAttribute('right-data-sort-direction')).toBe('asc');
  });

  it('sorts upper table with numeric and non-numeric values', () => {
    document.body.innerHTML = `
      <table id="myTable">
        <tr><td>header</td></tr>
        <tr>
          <td class="sortableCol" right-data-sort-direction="asc">H</td>
          <td class="right-sortable-items"><span>foo</span></td>
          <td class="right-sortable-items"><span>2</span></td>
        </tr>
        <tr>
          <td>row-a</td>
          <td class="right-sortable-items"><span>9</span></td>
          <td class="right-sortable-items"><span>1</span></td>
        </tr>
        <tr><td>row-b</td></tr>
      </table>
    `;

    sortColumns();
    const col = document.querySelector('.sortableCol') as HTMLElement;
    col.click();
    expect(col.getAttribute('right-data-sort-direction')).toBe('desc');
    col.click();
    expect(col.getAttribute('right-data-sort-direction')).toBe('asc');
  });

  it('sorts upper table when sortable rows have mismatched cell counts', () => {
    document.body.innerHTML = `
      <table id="myTable">
        <tr><td>header</td></tr>
        <tr>
          <td class="sortableCol" right-data-sort-direction="asc">H</td>
          <td class="right-sortable-items"><span>4</span></td>
        </tr>
        <tr>
          <td>row-a</td>
          <td class="right-sortable-items"></td>
          <td class="right-sortable-items"><span>2</span></td>
        </tr>
      </table>
    `;

    sortColumns();
    const col = document.querySelector('.sortableCol') as HTMLElement;
    col.click();
    expect(col.getAttribute('right-data-sort-direction')).toBe('desc');
  });

  it('keeps sortable columns stable with missing sortable values', () => {
    document.body.innerHTML = `
      <table id="myTable">
        <tr><td class="sortableCol" right-data-sort-direction="asc">H</td></tr>
        <tr><td>no-sortable-class</td></tr>
      </table>
    `;
    sortColumns();
    const col = document.querySelector('.sortableCol') as HTMLElement;
    col.click();
    expect(col.getAttribute('right-data-sort-direction')).toBe('desc');
  });

  it('handles empty sortable text nodes while sorting columns', () => {
    document.body.innerHTML = `
      <table id="myTable">
        <tr>
          <td class="sortableCol" right-data-sort-direction="asc">H</td>
          <td class="right-sortable-items"></td>
        </tr>
      </table>
    `;
    sortColumns();
    const col = document.querySelector('.sortableCol') as HTMLElement;
    col.click();
    expect(col.getAttribute('right-data-sort-direction')).toBe('desc');
  });

  it('keeps sortable columns stable when row index is out of range', () => {
    document.body.innerHTML = `
      <table id="myTable">
        <tr><td class="sortableCol" right-data-sort-direction="asc">H</td></tr>
      </table>
    `;
    sortColumns();
    const col = document.querySelector('.sortableCol') as HTMLElement;
    col.click();
    expect(col.getAttribute('right-data-sort-direction')).toBe('desc');
  });

  it('wires sortable row clicks and sorts tbody rows', () => {
    document.body.innerHTML = `
      <table id="myTable">
        <thead>
          <tr><td class="sortableRow" left-data-sort-direction="asc">Header</td></tr>
        </thead>
        <tbody>
          <tr class="sortus"><td class="left-sortable-items"><span>2</span></td><td>row-two</td></tr>
          <tr class="sortus"><td class="left-sortable-items"><span>10</span></td><td>row-ten</td></tr>
        </tbody>
      </table>
    `;

    sortRows();

    const rowTrigger = document.querySelector('.sortableRow') as HTMLElement;
    rowTrigger.click();
    expect(rowTrigger.getAttribute('left-data-sort-direction')).toBe('desc');

    const tbodyRows = Array.from(document.querySelectorAll('#myTable tbody tr'));
    expect(tbodyRows[0]?.textContent).toContain('row-ten');

    rowTrigger.click();
    expect(rowTrigger.getAttribute('left-data-sort-direction')).toBe('asc');
  });

  it('sorts rows when text content is non numeric', () => {
    document.body.innerHTML = `
      <table id="myTable">
        <thead>
          <tr><td class="sortableRow" left-data-sort-direction="asc">Header</td></tr>
        </thead>
        <tbody>
          <tr class="sortus"><td class="left-sortable-items"><span>foo</span></td><td>row-foo</td></tr>
          <tr class="sortus"><td class="left-sortable-items"><span>1</span></td><td>row-one</td></tr>
        </tbody>
      </table>
    `;

    sortRows();
    const rowTrigger = document.querySelector('.sortableRow') as HTMLElement;
    rowTrigger.click();
    expect(rowTrigger.getAttribute('left-data-sort-direction')).toBe('desc');
  });

  it('sorts rows when first compared cell is non numeric', () => {
    document.body.innerHTML = `
      <table id="myTable">
        <thead>
          <tr><td class="sortableRow" left-data-sort-direction="asc">Header</td></tr>
        </thead>
        <tbody>
          <tr class="sortus"><td class="left-sortable-items"><span>foo</span></td><td>row-foo</td></tr>
          <tr class="sortus"><td class="left-sortable-items"><span>bar</span></td><td>row-bar</td></tr>
        </tbody>
      </table>
    `;

    sortRows();
    const rowTrigger = document.querySelector('.sortableRow') as HTMLElement;
    rowTrigger.click();
    expect(rowTrigger.getAttribute('left-data-sort-direction')).toBe('desc');
  });

  it('adds hover behavior for tooltip visibility', () => {
    document.body.innerHTML = `
      <div class="right-sortable-items"><span class="tooltip">A</span></div>
      <div class="left-sortable-items"><span class="tooltip">B</span></div>
    `;

    addStyleTooltipWithHover();

    const right = document.querySelector('.right-sortable-items') as HTMLElement;
    const tip = right.querySelector('.tooltip') as HTMLElement;
    expect(tip.style.visibility).toBe('hidden');

    right.dispatchEvent(new MouseEvent('mouseover'));
    expect(tip.style.visibility).toBe('visible');
    right.dispatchEvent(new MouseEvent('mouseout'));
    expect(tip.style.visibility).toBe('hidden');
  });

  it('ignores hover wiring when tooltip is missing', () => {
    document.body.innerHTML = `
      <div class="right-sortable-items"><span>plain</span></div>
      <div class="left-sortable-items"><span class="tooltip">tip</span></div>
    `;
    addStyleTooltipWithHover();
    const right = document.querySelector('.right-sortable-items') as HTMLElement;
    expect(() => right.dispatchEvent(new MouseEvent('mouseover'))).not.toThrow();
  });
});
