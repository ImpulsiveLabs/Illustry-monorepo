import { axisChartExtractorXml } from '../../src/bzl/transformers/preprocess/transformers/axisChartTransformer';
import {
  calendarExtractorXml,
  calendarTransformer
} from '../../src/bzl/transformers/preprocess/transformers/calendarTransformers';
import {
  hierarchyExtractorXml,
  hierarchyTransformer
} from '../../src/bzl/transformers/preprocess/transformers/hierarchyTransformers';
import matrixExtractorXml from '../../src/bzl/transformers/preprocess/transformers/matrixTransformer';
import {
  nodeLinksExtractorXml,
  nodeLinkTransformer,
  nodesLinksExtractorCsvOrExcel
} from '../../src/bzl/transformers/preprocess/transformers/nodeLinkTransformers';
import {
  pieChartFunnelExtractorXml,
  pieChartFunnelTransformer
} from '../../src/bzl/transformers/preprocess/transformers/pieChartFunnelTransformer';
import {
  scatterExtractorXml,
  scatterTransformer
} from '../../src/bzl/transformers/preprocess/transformers/scatterTransformer';
import { wordCloudExtractorXml } from '../../src/bzl/transformers/preprocess/transformers/wordCloudTransformer';

describe('transformer fallback branches', () => {
  it('covers non-string coercion branches for csv/excel transformers', () => {
    const node = nodeLinkTransformer(
      {
        nodes: '1',
        categories: '2',
        properties: '3',
        sources: '4',
        targets: '5',
        values: '6'
      },
      ['', 123, 7, 999, 'A', 'B', 1],
      false
    ) as any;
    expect(node.nodeLink).toEqual({
      name: '123',
      category: '7',
      properties: '999',
      source: 'A',
      target: 'B',
      value: 1
    });

    const pie = pieChartFunnelTransformer(
      { names: '1', values: '2' },
      ['', 321, '5'],
      false
    ) as any;
    expect(pie.values).toEqual({ name: '321', value: 5 });

    const scatter = scatterTransformer(
      { values: '1,2', categories: '3', properties: '4' },
      ['', 1, 2, 'cat', 42],
      false
    ) as any;
    expect(scatter.points.properties).toBe('42');

    const scatterWithStringProps = scatterTransformer(
      { values: '1,2', categories: '3', properties: '4' },
      ['', 1, 2, 'cat', 'props'],
      false
    ) as any;
    expect(scatterWithStringProps.points.properties).toBe('props');

    const hierarchy = hierarchyTransformer(
      {
        names: '1',
        values: '2',
        categories: '3',
        properties: '4',
        children: '5'
      },
      ['', 'root', 1, 'c1', 100, 'child'],
      false
    ) as any;
    expect(hierarchy.nodes.properties).toBe('100');

    const hierarchyWithNumericName = hierarchyTransformer(
      {
        names: '1',
        values: '2',
        categories: '3',
        properties: '4',
        children: '5'
      },
      ['', 404, 1, 'c1', 'text-prop', 'child'],
      false
    ) as any;
    expect(hierarchyWithNumericName.nodes.name).toBe('404');

    const calendar = calendarTransformer(
      {
        dates: '1',
        values: '2',
        categories: '3',
        properties: '4'
      },
      ['', 45200, 1, 'cat', 77],
      false
    ) as any;
    expect(calendar.calendar.properties).toBe('77');

    const calendarWithDateObject = calendarTransformer(
      {
        dates: '1',
        values: '2',
        categories: '3',
        properties: '4'
      },
      ['', new Date('2020-01-02T00:00:00.000Z') as any, 1, 'cat', 'prop'],
      false
    ) as any;
    expect(calendarWithDateObject.calendar.date).toBe('2020-01-02');
  });

  it('covers node link extractor branch where source matches but target differs', () => {
    const result = nodesLinksExtractorCsvOrExcel([
      {
        nodeLink: {
          name: 'n1',
          category: '1',
          properties: 'p1',
          source: 'A',
          target: 'B',
          value: 1
        }
      } as any,
      {
        nodeLink: {
          name: 'n2',
          category: '2',
          properties: 'p2',
          source: 'A',
          target: 'C',
          value: 2
        }
      } as any
    ]);

    expect(result.links).toEqual([
      { source: 'A', target: 'B', value: 1 },
      { source: 'A', target: 'C', value: 2 }
    ]);
  });

  it('covers xml extractors fallback description branches when description is missing', () => {
    const baseRoot = {
      name: ['viz'],
      tags: ['tag'],
      type: ['line-chart']
    };

    expect(axisChartExtractorXml({
      root: {
        ...baseRoot,
        data: [{ headers: ['x'], values: [{ series: ['1', '2'] }] }]
      }
    } as any, true)).toMatchObject({ description: '' });

    expect(calendarExtractorXml({
      root: {
        ...baseRoot,
        type: ['calendar'],
        data: [{ calendar: [{ category: ['c'], date: ['2020-01-01'], value: ['1'] }] }]
      }
    } as any, true)).toMatchObject({ description: '' });

    expect(hierarchyExtractorXml({
      root: {
        ...baseRoot,
        type: ['treemap'],
        data: [{ nodes: [{ name: ['n'], category: ['c'], value: ['1'] }] }]
      }
    } as any, true)).toMatchObject({ description: '' });

    expect(matrixExtractorXml({
      root: {
        ...baseRoot,
        type: ['matrix'],
        data: [{
          nodes: [{ name: ['n'], category: ['c'] }],
          links: [{ source: ['a'], target: ['b'], value: ['1'] }]
        }]
      }
    } as any, true)).toMatchObject({ description: '' });

    expect(nodeLinksExtractorXml({
      root: {
        ...baseRoot,
        type: ['sankey'],
        data: [{
          nodes: [{ name: ['n'], category: ['c'] }],
          links: [{ source: ['a'], target: ['b'], value: ['1'] }]
        }]
      }
    } as any, true)).toMatchObject({ description: '' });

    expect(pieChartFunnelExtractorXml({
      root: {
        ...baseRoot,
        type: ['funnel'],
        data: [{ values: [{ first: ['1'] }] }]
      }
    } as any, true)).toMatchObject({ description: '' });

    expect(scatterExtractorXml({
      root: {
        ...baseRoot,
        type: ['scatter'],
        data: [{ points: [{ category: ['c'], value: ['1', '2'] }] }]
      }
    } as any, true)).toMatchObject({ description: '' });

    expect(wordCloudExtractorXml({
      root: {
        ...baseRoot,
        type: ['word-cloud'],
        data: [{ words: [{ name: ['w'], value: ['1'] }] }]
      }
    } as any, true)).toMatchObject({ description: '' });
  });
});
