import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import Hub from '@/app/(hub)/visualizationhub/page';
import { findDashboardSharedVisualization, findOneVisualization } from '@/app/_actions/visualization';
import { beforeEach, describe, it, vi, expect } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn()
  })
}));

// Mock the HubShell component
vi.mock('@/components/shells/hub-shell', () => ({
  __esModule: true,
  default: ({ data }: any) => (
    <div data-testid="hub-shell">Mock HubShell - {data?.name}</div>
  ),
}));

vi.mock('@/app/(hub)/visualizationhub/visualization-hub-client', () => ({
  __esModule: true,
  default: ({ visualization }: any) => (
    <div data-testid="hub-shell">Mock HubShell - {visualization?.name}</div>
  )
}));

// Mock the findOneVisualization function
vi.mock('@/app/_actions/visualization', async () => {
  return {
    findOneVisualization: vi.fn(),
    findSharedVisualization: vi.fn(),
    findDashboardSharedVisualization: vi.fn(),
  };
});

describe('Hub page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders HubShell with fetched visualization', async () => {
    const mockedData = { name: 'Test Viz', type: 'bar' };
    (findOneVisualization as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockedData);

    render(
      await Hub({
        searchParams: { name: 'Test Viz', type: 'bar' },
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId('hub-shell')).toHaveTextContent('Mock HubShell - Test Viz');
    });
  });

  it('passes undefined filters when search params are not strings', async () => {
    const mockedData = { name: 'Fallback Viz', type: 'bar' };
    (findOneVisualization as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockedData);

    render(
      await Hub({
        searchParams: { name: ['bad'], type: ['bad'] } as any,
      })
    );

    expect(findOneVisualization).not.toHaveBeenCalled();
  });

  it('fetches inherited visualizations through a dashboard share context', async () => {
    const mockedData = { name: 'Inherited Viz', type: 'bar-chart' };
    (findDashboardSharedVisualization as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockedData);

    render(
      await Hub({
        searchParams: { dashboardShare: 'dash_shared', name: 'Inherited Viz', type: 'bar-chart' },
      })
    );

    expect(findDashboardSharedVisualization).toHaveBeenCalledWith(
      'dash_shared',
      { name: 'Inherited Viz', type: 'bar-chart' }
    );
  });
});
