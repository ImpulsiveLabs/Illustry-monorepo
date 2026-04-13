import { render, screen } from '@testing-library/react';
import DashboardHub from '@/app/(hub)/dashboardhub/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

import { findOneDashboard } from '@/app/_actions/dashboard';
vi.mock('@/app/_actions/dashboard', () => ({
  findOneDashboard: vi.fn(),
}));

vi.mock('@/components/shells/dashboard-shell', () => ({
  __esModule: true,
  default: ({ dashboard }: { dashboard: any }) => (
    <div data-testid="resizable-dashboard">
      <p>Mock Dashboard: {dashboard?.name}</p>
    </div>
  ),
}));

describe('DashboardHub Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and renders the dashboard correctly', async () => {
    const mockDashboard = {
      id: 'dash-123',
      name: 'Sales Dashboard',
      layout: [],
      visualizations: [],
    };

    vi.mocked(findOneDashboard).mockResolvedValue(mockDashboard);

    const searchParams = {
      name: 'Sales Dashboard',
    };

    render(await DashboardHub({ searchParams } as any));

    expect(screen.getByTestId('resizable-dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Mock Dashboard: Sales Dashboard/i)).toBeInTheDocument();
    expect(findOneDashboard).toHaveBeenCalledWith('Sales Dashboard', true);
  });

  it('renders with undefined dashboard if no name provided', async () => {
    vi.mocked(findOneDashboard).mockResolvedValue(undefined);

    const searchParams = {
      name: '',
    };

    render(await DashboardHub({ searchParams } as any));

    expect(screen.getByTestId('resizable-dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Mock Dashboard:/i)).toBeInTheDocument();
  });

  it('falls back to empty name when search param is not a string', async () => {
    vi.mocked(findOneDashboard).mockResolvedValue(undefined);

    const searchParams = {
      name: ['Sales Dashboard'],
    } as any;

    render(await DashboardHub({ searchParams }));

    expect(findOneDashboard).toHaveBeenCalledWith('', true);
  });

  it('calls notFound when a named dashboard is not accessible', async () => {
    vi.mocked(findOneDashboard).mockResolvedValue(undefined);

    const searchParams = {
      name: 'Sales Dashboard',
    };

    await expect(DashboardHub({ searchParams } as any)).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalled();
  });
});
