import { render, screen } from '@testing-library/react';
import DashboardsLoading from '@/app/(data)/dashboards/loading';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';


vi.mock('@/components/data-table/data-table-loading', () => ({
    default: vi.fn(() => <div data-testid="mock-data-table-loading">Mocked DataTableLoading</div>),
}));

describe('DashboardsLoading', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        const { container } = render(<DashboardsLoading />);
        expect(screen.getByTestId('mock-data-table-loading')).toBeInTheDocument();
    });
});