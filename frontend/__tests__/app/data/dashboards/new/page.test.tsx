import React from 'react';
import { render, screen } from '@testing-library/react';
import NewDashboardPage from '@/app/(data)/dashboards/new/page';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/app/_actions/visualization', () => ({
  browseVisualizations: vi.fn()
}));

// Mock the form component
vi.mock('@/components/form/add-dashboard-form', () => ({
  __esModule: true,
  default: ({ visualizations }: { visualizations: Record<string, string> }) => (
    <div data-testid="add-dashboard-form">
      {Object.keys(visualizations).map((key) => (
        <div key={key} data-testid="visualization-item">
          {visualizations[key]}
        </div>
      ))}
    </div>
  )
}));

import { browseVisualizations } from '@/app/_actions/visualization';

describe('NewDashboardPage', () => {
  it('renders the dashboard page and passes visualizations to the form', async () => {
    // Arrange: Mock data
    const mockData = {
      visualizations: [
        { name: 'Sales Chart', type: 'bar' },
        { name: 'Revenue Graph', type: 'line' }
      ]
    };

    (browseVisualizations as jest.Mock).mockResolvedValue(mockData);

    // Act: Render the async component
    render(await NewDashboardPage());

    // Assert: Form is rendered
    const form = await screen.findByTestId('add-dashboard-form');
    expect(form).toBeInTheDocument();

    // Assert: Visualizations rendered
    const items = await screen.findAllByTestId('visualization-item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Sales Chart(bar)');
    expect(items[1]).toHaveTextContent('Revenue Graph(line)');
  });

  it('renders empty visualizations if none are returned', async () => {
    (browseVisualizations as jest.Mock).mockResolvedValue(undefined);

    render(await NewDashboardPage());

    const items = screen.queryAllByTestId('visualization-item');
    expect(items).toHaveLength(0);
  });
});
