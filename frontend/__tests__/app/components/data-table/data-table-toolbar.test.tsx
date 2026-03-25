import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import DataTableToolbar from '@/components/data-table/data-table-toolbar';

const push = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
    usePathname: () => '/projects',
    useSearchParams: () => ({
        toString: () => 'foo=bar'
    })
}));

vi.mock('next/image', () => ({
    default: ({ alt, ...props }: any) => <img alt={alt} {...props} />
}));

vi.mock('@/lib/hooks/use-debounce', () => ({
    default: (value: string) => value
}));

vi.mock('@/components/data-table/data-table-faceted-filter', () => ({
    default: ({ title }: any) => <div data-testid="faceted-filter">{title}</div>
}));

vi.mock('@/components/data-table/data-table-view-options', () => ({
    default: () => <div data-testid="view-options" />
}));

vi.mock('@/components/ui/table-action-button', () => ({
    default: () => <div data-testid="action-button" />
}));

describe('DataTableToolbar', () => {
    beforeEach(() => {
        push.mockReset();
    });

    it('submits text filter and resets filters', async () => {
        const user = userEvent.setup();
        const resetColumnFilters = vi.fn();

        const table = {
            getState: () => ({ columnFilters: [{ id: 'status', value: 'open' }] }),
            getColumn: () => ({})
        } as any;

        render(
            <DataTableToolbar
                table={{ ...table, resetColumnFilters } as any}
                filterableColumns={[{ id: 'status', title: 'Status', options: [] }]}
            />
        );

        const filterInput = screen.getByPlaceholderText('Filter...');
        await user.type(filterInput, 'abc');
        fireEvent.submit(filterInput.closest('form') as HTMLFormElement);

        expect(push).toHaveBeenCalledTimes(1);
        const [path, options] = push.mock.calls[0];
        expect(path).toContain('/projects?');
        expect(path).toContain('foo=bar');
        expect(path).toContain('page=1');
        expect(path).toContain('text=abc');
        expect(options).toEqual({ scroll: false });

        await user.click(screen.getByRole('button', { name: 'Reset filters' }));
        expect(resetColumnFilters).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('faceted-filter')).toHaveTextContent('Status');
        expect(screen.getByTestId('view-options')).toBeInTheDocument();
        expect(screen.getByTestId('action-button')).toBeInTheDocument();
    });

    it('does not render reset when table is not filtered', () => {
        const table = {
            getState: () => ({ columnFilters: [] }),
            getColumn: () => null,
            resetColumnFilters: vi.fn()
        } as any;

        render(<DataTableToolbar table={table} />);
        expect(screen.queryByRole('button', { name: 'Reset filters' })).not.toBeInTheDocument();
    });

    it('removes text query param when submitted text is empty', async () => {
        const user = userEvent.setup();

        const table = {
            getState: () => ({ columnFilters: [] }),
            getColumn: () => null,
            resetColumnFilters: vi.fn()
        } as any;

        render(
            <DataTableToolbar
                table={table}
                filterableColumns={[{ id: 'status', title: 'Status', options: [] }]}
            />
        );

        fireEvent.submit(screen.getByPlaceholderText('Filter...').closest('form') as HTMLFormElement);

        expect(push).toHaveBeenCalledTimes(1);
        const [path] = push.mock.calls[0];
        expect(path).toContain('page=1');
        expect(path).not.toContain('text=');
    });

    it('handles filterable columns with empty ids', () => {
        const table = {
            getState: () => ({ columnFilters: [] }),
            getColumn: vi.fn(() => null),
            resetColumnFilters: vi.fn()
        } as any;

        render(
            <DataTableToolbar
                table={table}
                filterableColumns={[{ id: '' as any, title: 'Empty', options: [] }]}
            />
        );

        expect(table.getColumn).toHaveBeenCalledWith('');
    });

    it('renders faceted filter when empty id column still resolves', () => {
        const table = {
            getState: () => ({ columnFilters: [] }),
            getColumn: vi.fn(() => ({})),
            resetColumnFilters: vi.fn()
        } as any;

        render(
            <DataTableToolbar
                table={table}
                filterableColumns={[{ id: '' as any, title: 'Fallback', options: [] }]}
            />
        );

        expect(screen.getByTestId('faceted-filter')).toHaveTextContent('Fallback');
    });
});
