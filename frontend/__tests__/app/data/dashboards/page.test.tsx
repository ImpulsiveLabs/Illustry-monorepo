import { render, screen } from '@testing-library/react';
import Dashboards, { type DashboardsProps } from '@/app/(data)/dashboards/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// 👇 Import the function so we can mock its implementation
import { browseDashboards } from '@/app/_actions/dashboard';

// 👇 Mock browseDashboards
vi.mock('@/app/_actions/dashboard', () => ({
  browseDashboards: vi.fn(),
}));

// 👇 Mock DashboardsTableShell component
vi.mock('@/components/shells/dashboards-table-shell', () => ({
  __esModule: true,
  default: ({ data, pageCount }: { data: any[]; pageCount: number }) => {
    return (
      <div data-testid="dashboards-table-shell">
        <p>Mocked Table</p>
        <div data-testid="data-length">{data.length}</div>
        <div data-testid="page-count">{pageCount}</div>
      </div>
    );
  },
}));

describe('Dashboards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders DashboardsTableShell with fetched data and pagination', async () => {
    const mockDashboards = {
      dashboards: [{ id: '1', name: 'Dashboard 1' }, { id: '2', name: 'Dashboard 2' }],
      pagination: { pageCount: 5 },
    };
    vi.mocked(browseDashboards).mockResolvedValue(mockDashboards);

    const searchParams: DashboardsProps['searchParams'] = {
      page: '1',
      text: 'test',
      per_page: '10',
      sort: 'name.asc',
    };

    render(await Dashboards({ searchParams }));

    expect(screen.getByTestId('dashboards-table-shell')).toBeInTheDocument();
    expect(screen.getByTestId('data-length').textContent).toBe('2');
    expect(screen.getByTestId('page-count').textContent).toBe('5');

    expect(browseDashboards).toHaveBeenCalledWith({
      page: 1,
      text: 'test',
      per_page: 10,
      sort: {
        sortOrder: 1,
        element: 'name',
      },
    } as const);
  });

  it('renders DashboardsTableShell with default values when searchParams is empty', async () => {
    const mockDashboards = {
      dashboards: [],
      pagination: { pageCount: 1 },
    };
    vi.mocked(browseDashboards).mockResolvedValue(mockDashboards);

    render(await Dashboards({ searchParams: {} }));

    expect(screen.getByTestId('dashboards-table-shell')).toBeInTheDocument();
    expect(screen.getByTestId('data-length').textContent).toBe('0');
    expect(screen.getByTestId('page-count').textContent).toBe('1');

    expect(browseDashboards).toHaveBeenCalledWith({
      page: 1,
      per_page: 10,
      sort: undefined,
    } as const);
  });
});
