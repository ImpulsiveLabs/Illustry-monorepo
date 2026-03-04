import { render, screen } from '@testing-library/react';
import Visualizations from '@/app/(data)/visualizations/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// 👇 Mock the browseVisualizations function
import { browseVisualizations } from '@/app/_actions/visualization';
vi.mock('@/app/_actions/visualization', () => ({
  browseVisualizations: vi.fn(),
}));

// 👇 Mock the VisualizationsTableShell component
vi.mock('@/components/shells/visualizations-table-shell', () => ({
  __esModule: true,
  default: ({ data, pageCount }: { data: any[]; pageCount: number }) => (
    <div data-testid="visualizations-table-shell">
      <p>Mocked Table</p>
      <div data-testid="data-length">{data.length}</div>
      <div data-testid="page-count">{pageCount}</div>
    </div>
  ),
}));

describe('Visualizations Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders visualizations with correct data and pagination', async () => {
    const mockData = {
      visualizations: [
        { id: '1', name: 'Vis 1' },
        { id: '2', name: 'Vis 2' }
      ],
      pagination: { pageCount: 3 },
    };
    vi.mocked(browseVisualizations).mockResolvedValue(mockData);

    const searchParams = {
      page: '2',
      per_page: '10',
      sort: 'name.asc',
      text: 'searchTerm',
    };

    render(await Visualizations({ searchParams }));

    expect(screen.getByTestId('visualizations-table-shell')).toBeInTheDocument();
    expect(screen.getByTestId('data-length').textContent).toBe('2');
    expect(screen.getByTestId('page-count').textContent).toBe('3');

    expect(browseVisualizations).toHaveBeenCalledWith({
      page: 2,
      per_page: 10,
      text: 'searchTerm',
      sort: {
        sortOrder: 1,
        element: 'name',
      },
    });
  });

  it('uses default pagination and renders empty data when searchParams is empty', async () => {
    vi.mocked(browseVisualizations).mockResolvedValue({
      visualizations: [],
      pagination: { pageCount: 1 },
    });

    render(await Visualizations({ searchParams: {} }));

    expect(screen.getByTestId('visualizations-table-shell')).toBeInTheDocument();
    expect(screen.getByTestId('data-length').textContent).toBe('0');
    expect(screen.getByTestId('page-count').textContent).toBe('1');

    expect(browseVisualizations).toHaveBeenCalledWith({
      page: 1,
      per_page: 10,
    });
  });
});
