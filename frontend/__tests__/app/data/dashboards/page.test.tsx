import { render, screen } from '@testing-library/react';
import Dashboards, { type DashboardsProps } from '@/app/(data)/dashboards/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// 👇 Import the function so we can mock its implementation
import { browseDashboards, findOneDashboard } from '@/app/_actions/dashboard';
import { browseVisualizations } from '@/app/_actions/visualization';

// 👇 Mock browseDashboards
vi.mock('@/app/_actions/dashboard', () => ({
  browseDashboards: vi.fn(),
  findOneDashboard: vi.fn(),
}));

vi.mock('@/app/_actions/visualization', () => ({
  browseVisualizations: vi.fn(),
}));

// 👇 Mock DashboardsTableShell component
vi.mock('@/components/shells/dashboards-table-shell', () => ({
  __esModule: true,
  default: ({ data, pageCount, external }: { data: any[]; pageCount: number; external?: boolean }) => {
    return (
      <div data-testid={external ? 'external-dashboards-table-shell' : 'dashboards-table-shell'}>
        <p>Mocked Table</p>
        <div data-testid="data-length">{data.length}</div>
        <div data-testid="page-count">{pageCount}</div>
      </div>
    );
  },
}));

vi.mock('@/components/ui/error-card', () => ({
  __esModule: true,
  default: ({ title, description }: { title: string; description: string }) => (
    <section data-testid="error-card">
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  ),
}));

describe('Dashboards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(browseVisualizations).mockResolvedValue({ visualizations: [], pagination: { pageCount: 1 } });
    vi.mocked(findOneDashboard).mockResolvedValue(null);
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
    expect(screen.getAllByTestId('data-length')[0].textContent).toBe('2');
    expect(screen.getAllByTestId('page-count')[0].textContent).toBe('5');

    expect(browseDashboards).toHaveBeenNthCalledWith(1, {
      page: 1,
      text: 'test',
      per_page: 10,
      sharedScope: 'owned',
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
    expect(screen.getAllByTestId('data-length')[0].textContent).toBe('0');
    expect(screen.getAllByTestId('page-count')[0].textContent).toBe('1');

    expect(browseDashboards).toHaveBeenNthCalledWith(1, {
      page: 1,
      per_page: 10,
      sharedScope: 'owned',
      sort: undefined,
    } as const);
  });

  it('handles desc sorting and malformed payload fallbacks', async () => {
    vi.mocked(browseDashboards).mockResolvedValue({
      dashboards: null as any,
      pagination: { pageCount: 'invalid' as any },
    });

    render(await Dashboards({
      searchParams: {
        page: '2',
        per_page: '20',
        sort: 'name.desc',
      },
    }));

    expect(screen.getAllByTestId('data-length')[0].textContent).toBe('0');
    expect(screen.getAllByTestId('page-count')[0].textContent).toBe('1');
    expect(browseDashboards).toHaveBeenNthCalledWith(1, {
      page: 2,
      per_page: 20,
      sharedScope: 'owned',
      sort: { sortOrder: -1, element: 'name' },
    } as const);
  });

  it('renders the external mode as a single table', async () => {
    vi.mocked(browseDashboards).mockResolvedValue({
      dashboards: [{ name: 'External dashboard' }],
      pagination: { pageCount: 1 },
    });

    render(await Dashboards({ searchParams: { scope: 'external' } }));

    expect(screen.getByTestId('external-dashboards-table-shell')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboards-table-shell')).not.toBeInTheDocument();
    expect(browseDashboards).toHaveBeenCalledTimes(1);
    expect(browseDashboards).toHaveBeenCalledWith({
      page: 1,
      per_page: 10,
      sharedScope: 'external',
      sort: undefined,
    });
  });

  it('renders backend unavailable when dashboards cannot be loaded', async () => {
    vi.mocked(browseDashboards).mockResolvedValue(null);

    render(await Dashboards({ searchParams: {} }));

    expect(screen.getByTestId('error-card')).toHaveTextContent('Backend unavailable');
    expect(screen.getByTestId('error-card')).toHaveTextContent('Your session was not cleared');
    expect(screen.queryByTestId('dashboards-table-shell')).not.toBeInTheDocument();
  });

  it('renders backend unavailable when dashboard form visualizations cannot be loaded', async () => {
    vi.mocked(browseDashboards).mockResolvedValue({
      dashboards: [],
      pagination: { pageCount: 1 },
    });
    vi.mocked(browseVisualizations).mockResolvedValue(null);

    render(await Dashboards({ searchParams: { modal: 'new' } }));

    expect(screen.getByTestId('error-card')).toHaveTextContent('Backend unavailable');
    expect(screen.getByTestId('error-card')).toHaveTextContent('dashboard form could not load visualizations');
  });
});
