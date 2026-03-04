import React from 'react';
import { render, screen } from '@testing-library/react';
import DataLoading from '@/app/(data)/visualizations/loading';
import { describe, it, expect, vi } from 'vitest';

// Mock DataTableLoading
vi.mock('@/components/data-table/data-table-loading', () => ({
  __esModule: true,
  default: ({ columnCount, isNewRowCreatable, isRowsDeletable }: any) => (
    <div data-testid="mock-data-table-loading">
      columnCount: {columnCount}, creatable: {String(isNewRowCreatable)}, deletable: {String(isRowsDeletable)}
    </div>
  ),
}));

describe('DataLoading', () => {
  it('renders DataTableLoading with correct props', () => {
    render(<DataLoading />);

    const mockedComponent = screen.getByTestId('mock-data-table-loading');
    expect(mockedComponent).toBeInTheDocument();
    expect(mockedComponent).toHaveTextContent('columnCount: 6');
    expect(mockedComponent).toHaveTextContent('creatable: true');
    expect(mockedComponent).toHaveTextContent('deletable: true');
  });
});
