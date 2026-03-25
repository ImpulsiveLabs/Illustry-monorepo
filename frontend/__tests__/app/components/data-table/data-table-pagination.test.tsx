import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import DataTablePagination from '@/components/data-table/data-table-pagination';

describe('DataTablePagination', () => {
    it('renders pagination details and triggers actions', async () => {
        const user = userEvent.setup();
        const setPageIndex = vi.fn();
        const previousPage = vi.fn();
        const nextPage = vi.fn();

        const table = {
            getFilteredSelectedRowModel: () => ({ rows: [{ id: '1' }, { id: '2' }] }),
            getFilteredRowModel: () => ({ rows: Array.from({ length: 20 }).map((_, i) => ({ id: String(i) })) }),
            getState: () => ({ pagination: { pageSize: 10, pageIndex: 1 } }),
            setPageSize: vi.fn(),
            getPageCount: () => 5,
            setPageIndex,
            previousPage,
            nextPage,
            getCanPreviousPage: () => true,
            getCanNextPage: () => true
        } as any;

        render(<DataTablePagination table={table} pageSizeOptions={[10, 20]} />);

        expect(screen.getByText('2 / 20 rows selected')).toBeInTheDocument();
        expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Go to first page' }));
        await user.click(screen.getByRole('button', { name: 'Go to previous page' }));
        await user.click(screen.getByRole('button', { name: 'Go to next page' }));
        await user.click(screen.getByRole('button', { name: 'Go to last page' }));
        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByText('20'));

        expect(setPageIndex).toHaveBeenCalledWith(0);
        expect(previousPage).toHaveBeenCalledTimes(1);
        expect(nextPage).toHaveBeenCalledTimes(1);
        expect(setPageIndex).toHaveBeenCalledWith(4);
        expect(table.setPageSize).toHaveBeenCalledWith(20);
    });
});
