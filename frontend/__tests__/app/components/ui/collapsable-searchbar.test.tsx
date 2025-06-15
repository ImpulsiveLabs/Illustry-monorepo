import { render, screen, fireEvent, } from '@testing-library/react';
import CollapsableSearchBar from '@/components/ui/collapsable-searchbar';
import { VisualizationTypes } from '@illustry/types';
import React from 'react';
import { describe, it, expect,vi  } from 'vitest';

vi.mock('@/lib/filter', () => ({
  default: vi.fn((search, data) => data.filter((item: any) => item.name.includes(search)))
}));
vi.mock('@/lib/filter/axis', () => ({ axisWords: ['x', 'y'] }));
vi.mock('@/lib/filter/calendar', () => ({ calendarWords: ['date', 'month'] }));
vi.mock('@/lib/filter/nodeLink', () => ({ nodeLinksWords: ['node', 'link'] }));
vi.mock('@/lib/filter/funnelPie', () => ({ funnelPieWords: ['funnel', 'pie'] }));
vi.mock('@/lib/filter/wordcloud', () => ({ wordCloudWords: ['cloud'] }));
vi.mock('@/lib/filter/scatter', () => ({ scatterWords: ['point'] }));
vi.mock('@/lib/filter/timeline', () => ({ timelineWords: ['timeline'] }));
vi.mock('@/lib/filter/hierarchy', () => ({ hierarchyWords: ['parent', 'child'] }));
vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(typeof actual === 'object' && actual !== null ? actual : {}),
    catchError: vi.fn(),
  };
});

describe('CollapsableSearchBar', () => {
  const sampleData = [
    { name: 'Sales Chart', id: 1 },
    { name: 'Revenue Chart', id: 2 },
    { name: 'User Timeline', id: 3 }
  ];

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
});
