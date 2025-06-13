import { render, screen, waitFor } from '@testing-library/react';
import UpdateDashboardPage from '@/app/(data)/dashboards/[dashboardName]/page';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { findOneDashboard } from '@/app/_actions/dashboard';
import { browseVisualizations } from '@/app/_actions/visualization';

// Mocks
vi.mock('@/app/_actions/dashboard', () => ({
    findOneDashboard: vi.fn()
}));

vi.mock('@/app/_actions/visualization', () => ({
    browseVisualizations: vi.fn()
}));

vi.mock('@/components/form/update-dashboard-form', () => ({
    __esModule: true,
    default: ({ dashboard, visualizations }: any) => (
        <div data-testid="update-dashboard-form">
            <div>Dashboard: {dashboard.name}</div>
            <div>Visualizations: {Object.keys(visualizations).join(', ')}</div>
        </div>
    )
}));


describe('UpdateDashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

  it('renders the form with fetched dashboard and visualizations', async () => {
    const mockDashboard = { name: 'Sales', description: 'Sales Dashboard' };
    const mockVisualizations = {
        visualizations: [
            { name: 'Revenue', type: 'bar' },
            { name: 'Profit', type: 'line' }
        ]
    };

    (findOneDashboard as any).mockResolvedValue(mockDashboard);
    (browseVisualizations as any).mockResolvedValue(mockVisualizations);

    const params = { dashboardName: 'Sales' };

    const result = await UpdateDashboardPage({ params }); // Await the server component
    render(result); // Render the resulting React element

    await waitFor(() => {
        expect(screen.getByTestId('update-dashboard-form')).toBeInTheDocument();
    });

    expect(findOneDashboard).toHaveBeenCalledWith('Sales', false);
    expect(browseVisualizations).toHaveBeenCalledWith({ per_page: 100 });

    expect(screen.getByText(/Dashboard: Sales/i)).toBeInTheDocument();
    expect(screen.getByText(/Visualizations: Revenue\(bar\), Profit\(line\)/i)).toBeInTheDocument();
});
});
