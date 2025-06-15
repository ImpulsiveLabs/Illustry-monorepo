import { render, screen } from '@testing-library/react';
import Legend from '@/components/ui/legend';
import React from 'react';
import { describe, it, expect } from 'vitest';

describe('Legend', () => {
  const mockLegendData = {
    'Category A': '#ff0000',
    'Category B': '#00ff00',
    'Category C': '#0000ff',
  };

  it('renders all legend items', () => {
    render(<Legend legendData={mockLegendData} />);

    Object.keys(mockLegendData).forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('renders the correct number of legend items', () => {
    render(<Legend legendData={mockLegendData} />);
    const items = screen.getAllByRole('presentation');
    expect(items.length).toBe(Object.keys(mockLegendData).length);
  });

  it('applies the correct background colors', () => {
    render(<Legend legendData={mockLegendData} />);
    const items = screen.getAllByRole('presentation');

    items.forEach((item, index) => {
      const name = Object.keys(mockLegendData)[index];
      expect(item).toHaveStyle(`background-color: ${mockLegendData[name]}`);
    });
  });

  it('uses default maxItemsPerRow when not provided', () => {
    render(<Legend legendData={mockLegendData} />);
    const wrappers = screen.getAllByTestId('legend-item');

    wrappers.forEach((wrapper) => {
      expect(wrapper).toHaveStyle(`flex: 1 0 calc(100% / 10)`);
    });
  });

  it('respects the provided maxItemsPerRow prop', () => {
    render(<Legend legendData={mockLegendData} maxItemsPerRow={5} />);
    const wrappers = screen.getAllByTestId('legend-item');

    wrappers.forEach((wrapper) => {
      expect(wrapper).toHaveStyle(`flex: 1 0 calc(100% / 5)`);
    });
  });
});
