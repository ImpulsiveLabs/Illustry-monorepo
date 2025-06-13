import { render, screen } from '@testing-library/react';
import NewVisualizationPage from '@/app/(data)/visualizations/new/page';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// ✅ Mock the AddVisualizationForm component
vi.mock('@/components/form/add-visualization-form', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="add-Visualization-form">Mocked AddVisualizationForm</div>
  ),
}));

describe('NewVisualizationPage', () => {
  it('renders AddVisualizationForm inside the styled wrapper', () => {
    render(<NewVisualizationPage />);

    expect(screen.getByTestId('add-Visualization-form')).toBeInTheDocument();
    expect(screen.getByText('Mocked AddVisualizationForm')).toBeInTheDocument();
  });
});
