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
  default: ({ data, pageCount, external }: { data: any[]; pageCount: number; external?: boolean }) => (
    <div data-testid={external ? 'external-visualizations-table-shell' : 'visualizations-table-shell'}>
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
    expect(screen.getAllByTestId('data-length')[0].textContent).toBe('2');
    expect(screen.getAllByTestId('page-count')[0].textContent).toBe('3');

    expect(browseVisualizations).toHaveBeenNthCalledWith(1, {
      page: 2,
      per_page: 10,
      text: 'searchTerm',
      sharedScope: 'owned',
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
    expect(screen.getAllByTestId('data-length')[0].textContent).toBe('0');
    expect(screen.getAllByTestId('page-count')[0].textContent).toBe('1');

    expect(browseVisualizations).toHaveBeenNthCalledWith(1, {
      page: 1,
      per_page: 10,
      sharedScope: 'owned',
    });
  });

  it('handles desc sorting and malformed payload fallbacks', async () => {
    vi.mocked(browseVisualizations).mockResolvedValue({
      visualizations: null as any,
      pagination: { pageCount: 'invalid' as any },
    });

    render(await Visualizations({
      searchParams: {
        page: '3',
        per_page: '20',
        sort: 'name.desc',
      },
    }));

    expect(screen.getAllByTestId('data-length')[0].textContent).toBe('0');
    expect(screen.getAllByTestId('page-count')[0].textContent).toBe('1');
    expect(browseVisualizations).toHaveBeenNthCalledWith(1, {
      page: 3,
      per_page: 20,
      sharedScope: 'owned',
      sort: { sortOrder: -1, element: 'name' },
    });
  });

  it('renders the external mode as a single table', async () => {
    vi.mocked(browseVisualizations).mockResolvedValue({
      visualizations: [{ name: 'External visualization' }],
      pagination: { pageCount: 1 },
    });

    render(await Visualizations({ searchParams: { scope: 'external' } }));

    expect(screen.getByTestId('external-visualizations-table-shell')).toBeInTheDocument();
    expect(screen.queryByTestId('visualizations-table-shell')).not.toBeInTheDocument();
    expect(browseVisualizations).toHaveBeenCalledTimes(1);
    expect(browseVisualizations).toHaveBeenCalledWith({
      page: 1,
      per_page: 10,
      sharedScope: 'external',
    });
  });
});
