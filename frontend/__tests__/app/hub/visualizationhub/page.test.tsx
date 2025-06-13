import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import Hub from '@/app/(hub)/visualizationhub/page';
import { findOneVisualization } from '@/app/_actions/visualization';
import { describe, it, vi, expect } from 'vitest';

// Mock the HubShell component
vi.mock('@/components/shells/hub-shell', () => ({
  __esModule: true,
  default: ({ data }: any) => (
    <div data-testid="hub-shell">Mock HubShell - {data?.name}</div>
  ),
}));

// Mock the findOneVisualization function
vi.mock('@/app/_actions/visualization', async () => {
  return {
    findOneVisualization: vi.fn(),
  };
});

describe('Hub page', () => {
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
});
