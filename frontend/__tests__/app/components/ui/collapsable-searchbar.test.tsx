import { render, screen, fireEvent } from '@testing-library/react';
import CollapsableSearchBar from '@/components/ui/collapsable-searchbar';
import { VisualizationTypes } from '@illustry/types';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { parseFilterSpy, catchErrorSpy } = vi.hoisted(() => ({
  parseFilterSpy: vi.fn(),
  catchErrorSpy: vi.fn()
}));

vi.mock('@/lib/filter', () => ({
  default: parseFilterSpy
}));
vi.mock('@/lib/filter/axis', () => ({ axisWords: ['x', 'y'] }));
vi.mock('@/lib/filter/calendar', () => ({ calendarWords: ['date', 'month'] }));
vi.mock('@/lib/filter/nodeLink', () => ({ nodeLinksWords: ['node', 'link'] }));
vi.mock('@/lib/filter/funnelPie', () => ({ funnelPieWords: ['funnel', 'pie'] }));
vi.mock('@/lib/filter/wordcloud', () => ({ wordCloudWords: ['cloud'] }));
vi.mock('@/lib/filter/scatter', () => ({ scatterWords: ['point'] }));
vi.mock('@/lib/filter/timeline', () => ({ timelineWords: ['timeline'] }));
vi.mock('@/lib/filter/hierarchy', () => ({ hierarchyWords: ['parent', 'child'] }));
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual<any>('@/lib/utils');
  return {
    ...actual,
    catchError: catchErrorSpy
  };
});

describe('CollapsableSearchBar', () => {
  const sampleData = [
    { name: 'Sales Chart', id: 1 },
    { name: 'Revenue Chart', id: 2 },
    { name: 'User Timeline', id: 3 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    parseFilterSpy.mockImplementation((search: string, data: any[]) =>
      data.filter((item: any) => item.name.includes(search))
    );
  });

  it('renders input and buttons correctly', () => {
    const setFilteredData = vi.fn();
    render(
      <CollapsableSearchBar
        data={sampleData}
        setFilteredData={setFilteredData}
        type={VisualizationTypes.VisualizationTypesEnum.LINE_CHART}
      />
    );

    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Sales' } });

    const filterBtn = screen.getByRole('button', { name: /filter/i });
    const refreshBtn = screen.getByRole('button', { name: /refresh/i });

    expect(filterBtn).toBeInTheDocument();
    expect(refreshBtn).toBeInTheDocument();
  });

  it('calls setFilteredData with filtered results on submit', () => {
    const setFilteredData = vi.fn();
    render(
      <CollapsableSearchBar
        data={sampleData}
        setFilteredData={setFilteredData}
        type={VisualizationTypes.VisualizationTypesEnum.LINE_CHART}
      />
    );

    const input = screen.getByRole('searchbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Revenue' } });

    fireEvent.submit(input);

    expect(setFilteredData).toHaveBeenCalledWith([
      { name: 'Revenue Chart', id: 2 }
    ]);
  });

  it('handles input width classes across focus/blur and empty value', () => {
    const setFilteredData = vi.fn();
    render(
      <CollapsableSearchBar
        data={sampleData}
        setFilteredData={setFilteredData}
        type={VisualizationTypes.VisualizationTypesEnum.BAR_CHART}
      />
    );

    const input = screen.getByRole('searchbox');
    expect(input.className).toContain('w-12');

    fireEvent.focus(input);
    expect(input.className).toContain('w-screen');

    fireEvent.change(input, { target: { value: 'Sales' } });
    fireEvent.blur(input);
    expect(input.className).toContain('w-screen');

    fireEvent.change(input, { target: { value: '   ' } });
    expect(input.className).toContain('w-12');
  });

  it('restores original data on refresh', () => {
    const setFilteredData = vi.fn();
    render(
      <CollapsableSearchBar
        data={sampleData}
        setFilteredData={setFilteredData}
        type={VisualizationTypes.VisualizationTypesEnum.BAR_CHART}
      />
    );

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'User' } });

    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshBtn);

    expect(setFilteredData).toHaveBeenCalledWith(sampleData);
  });

  it('maps every visualization type group to expected filter words', () => {
    const setFilteredData = vi.fn();
    const cases: Array<[VisualizationTypes.VisualizationTypesEnum, string[]]> = [
      [VisualizationTypes.VisualizationTypesEnum.LINE_CHART, ['x', 'y']],
      [VisualizationTypes.VisualizationTypesEnum.BAR_CHART, ['x', 'y']],
      [VisualizationTypes.VisualizationTypesEnum.CALENDAR, ['date', 'month']],
      [VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH, ['node', 'link']],
      [VisualizationTypes.VisualizationTypesEnum.MATRIX, ['node', 'link']],
      [VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING, ['node', 'link']],
      [VisualizationTypes.VisualizationTypesEnum.SANKEY, ['node', 'link']],
      [VisualizationTypes.VisualizationTypesEnum.FUNNEL, ['funnel', 'pie']],
      [VisualizationTypes.VisualizationTypesEnum.PIE_CHART, ['funnel', 'pie']],
      [VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD, ['cloud']],
      [VisualizationTypes.VisualizationTypesEnum.SCATTER, ['point']],
      [VisualizationTypes.VisualizationTypesEnum.TIMELINE, ['timeline']],
      [VisualizationTypes.VisualizationTypesEnum.TREEMAP, ['parent', 'child']],
      [VisualizationTypes.VisualizationTypesEnum.SUNBURST, ['parent', 'child']]
    ];

    for (const [type, words] of cases) {
      const { unmount } = render(
        <CollapsableSearchBar
          data={sampleData}
          setFilteredData={setFilteredData}
          type={type}
        />
      );

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'Sales' } });
      fireEvent.submit(input);

      expect(parseFilterSpy).toHaveBeenLastCalledWith('Sales', sampleData, words, type);
      unmount();
    }
  });

  it('uses empty words for unknown type and catches parse errors', () => {
    const setFilteredData = vi.fn();
    const unknownType = 'unknown-type' as VisualizationTypes.VisualizationTypesEnum;
    parseFilterSpy.mockImplementation(() => {
      throw new Error('parse fail');
    });

    render(
      <CollapsableSearchBar
        data={sampleData}
        setFilteredData={setFilteredData}
        type={unknownType}
      />
    );

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Sales' } });
    fireEvent.submit(input);

    expect(parseFilterSpy).toHaveBeenCalledWith('Sales', sampleData, [], unknownType);
    expect(catchErrorSpy).toHaveBeenCalled();
  });
});
