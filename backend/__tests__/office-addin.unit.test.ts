import { VisualizationTypes } from '@illustry/types';
import { createOfficeVisualizationPreview } from '../src/utils/office-addin';

describe('office add-in preview utility', () => {
  it('builds a backend-computed bar chart preview from an Excel range', () => {
    const preview = createOfficeVisualizationPreview({
      type: VisualizationTypes.VisualizationTypesEnum.BAR_CHART,
      title: 'Revenue',
      values: [
        ['Month', 'Sales', 'Cost'],
        ['Jan', 10, 4],
        ['Feb', '=A1', 5]
      ],
      formulas: [
        ['', '', ''],
        ['', '', ''],
        ['', '=SUM(B2:B2)', '']
      ]
    });

    expect(preview.title).toBe('Revenue');
    expect(preview.type).toBe(VisualizationTypes.VisualizationTypesEnum.BAR_CHART);
    expect((preview.data as VisualizationTypes.AxisChartData).headers).toEqual(['Jan', 'Feb']);
    expect((preview.data as VisualizationTypes.AxisChartData).values).toEqual({
      Sales: [10, 0],
      Cost: [4, 5]
    });
    expect(preview.option.series).toEqual([
      { name: 'Sales', type: 'bar', data: [10, 0] },
      { name: 'Cost', type: 'bar', data: [4, 5] }
    ]);
  });

  it('builds graph data from source-target-value rows', () => {
    const preview = createOfficeVisualizationPreview({
      type: VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH,
      values: [
        ['Source', 'Target', 'Value'],
        ['A', 'B', 3],
        ['B', 'C', 2]
      ]
    });

    const data = preview.data as VisualizationTypes.NodeLinkData;
    expect(data.nodes.map((node) => node.name)).toEqual(['A', 'B', 'C']);
    expect(data.links).toEqual([
      { source: 'A', target: 'B', value: 3 },
      { source: 'B', target: 'C', value: 2 }
    ]);
    expect(preview.option.series).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'graph', layout: 'force' })
    ]));
  });

  it('rejects empty ranges before the add-in tries to render them', () => {
    expect(() => createOfficeVisualizationPreview({ values: [[]] })).toThrow(
      'Select a non-empty Excel range before rendering a visualization.'
    );
  });
});
