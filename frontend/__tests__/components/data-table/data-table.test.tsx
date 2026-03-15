import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DataTable from '@/components/data-table/data-table';

const push = vi.fn();
const toolbarState = {
    applyArrayFilter: false,
    applyStringFilter: false,
    selectAllRows: false
};
const searchState = {
    page: '2' as string | null,
    perPage: '5' as string | null,
    sort: 'name.desc' as string | null,
    query: 'page=2&per_page=5&sort=name.desc&status=active',
    entries: [['2', 'page'], ['5', 'per_page'], ['name.desc', 'sort'], ['active', 'status']] as Array<[string, string]>
};

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
    usePathname: () => '/projects',
    useSearchParams: () => ({
        get: (key: string) => {
            if (key === 'page') return searchState.page;
            if (key === 'per_page') return searchState.perPage;
            if (key === 'sort') return searchState.sort;
            return null;
        },
        toString: () => searchState.query,
        forEach: (cb: (value: string, key: string) => void) => {
            searchState.entries.forEach(([value, key]) => cb(value, key));
        }
    })
}));

vi.mock('@/components/data-table/data-table-toolbar', () => ({
    default: ({ table }: any) => {
        React.useEffect(() => {
            if (toolbarState.applyArrayFilter) {
                table.getColumn('name')?.setFilterValue(['Alice']);
            }
            if (toolbarState.applyStringFilter) {
                table.getColumn('name')?.setFilterValue('Alice');
            }
            if (toolbarState.selectAllRows) {
                table.toggleAllRowsSelected?.(true);
            }
        }, [table]);
        return <div data-testid="toolbar">toolbar</div>;
    }
}));

vi.mock('@/components/data-table/data-table-pagination', () => ({
    default: () => <div data-testid="pagination">pagination</div>
}));

describe('DataTable', () => {
    beforeEach(() => {
        push.mockClear();
        searchState.page = '2';
        searchState.perPage = '5';
        searchState.sort = 'name.desc';
        searchState.query = 'page=2&per_page=5&sort=name.desc&status=active';
        searchState.entries = [['2', 'page'], ['5', 'per_page'], ['name.desc', 'sort'], ['active', 'status']];
        toolbarState.applyArrayFilter = false;
        toolbarState.applyStringFilter = false;
        toolbarState.selectAllRows = false;
    });

    it('renders no-results state and syncs pagination/sort/filter query params', async () => {
        toolbarState.applyArrayFilter = true;
        render(
            <DataTable
                columns={[{ accessorKey: 'name', header: 'Name' }] as any}
                data={[]}
                pageCount={2}
                filterableColumns={[{ id: 'name', title: 'Name', options: [] }] as any}
            />
        );

        expect(screen.getByText('No results.')).toBeInTheDocument();
        expect(screen.getByTestId('toolbar')).toBeInTheDocument();
        expect(screen.getByTestId('pagination')).toBeInTheDocument();

        await waitFor(() => {
            expect(push).toHaveBeenCalled();
        });
        expect(push.mock.calls.some((c) => String(c[0]).includes('sort=name.desc'))).toBe(true);
        expect(push.mock.calls.some((c) => String(c[0]).includes('name=Alice'))).toBe(true);
    });

    it('renders rows and cells when data exists', () => {
        render(
            <DataTable
                columns={[{ accessorKey: 'name', header: 'Name' }, { accessorKey: 'age', header: 'Age' }] as any}
                data={[{ name: 'Alice', age: 30 }] as any}
                pageCount={1}
            />
        );

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('falls back to default paging and empty table data when search params are missing', async () => {
        searchState.page = null;
        searchState.perPage = null;
        searchState.sort = null;
        searchState.query = '';
        searchState.entries = [];

        render(
            <DataTable
                columns={[{ accessorKey: 'name', header: 'Name' }] as any}
                data={null as any}
                pageCount={1}
            />
        );

        expect(screen.getByText('No results.')).toBeInTheDocument();

        await waitFor(() => {
            expect(push).toHaveBeenCalled();
        });
        expect(push.mock.calls.some((call) => String(call[0]).includes('per_page=10'))).toBe(true);
    });

    it('removes stale filter params when a filterable key is present without active column filter', async () => {
        searchState.page = '1';
        searchState.perPage = '10';
        searchState.sort = 'name.asc';
        searchState.query = 'page=1&per_page=10&sort=name.asc&status=active';
        searchState.entries = [['1', 'page'], ['10', 'per_page'], ['name.asc', 'sort'], ['active', 'status']];

        render(
            <DataTable
                columns={[{ accessorKey: 'name', header: 'Name' }] as any}
                data={[]}
                pageCount={1}
                filterableColumns={[{ id: 'status', title: 'Status', options: [] }] as any}
            />
        );

        await waitFor(() => {
            expect(push).toHaveBeenCalled();
        });
        const latestPath = String(push.mock.calls.at(-1)?.[0] ?? '');
        expect(latestPath).not.toContain('status=active');
    });

    it('renders grouped headers with placeholder cells', () => {
        render(
            <DataTable
                columns={[
                    {
                        header: 'Group',
                        columns: [{ accessorKey: 'name', header: 'Name' }]
                    }
                ] as any}
                data={[{ name: 'Alice' }] as any}
                pageCount={1}
            />
        );

        expect(screen.getByText('Group')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('renders placeholder header groups from uneven nested columns', () => {
        render(
            <DataTable
                columns={[
                    {
                        header: 'Group A',
                        columns: [{ accessorKey: 'name', header: 'Name' }]
                    },
                    {
                        header: 'Age',
                        accessorKey: 'age'
                    }
                ] as any}
                data={[{ name: 'Alice', age: 30 }] as any}
                pageCount={1}
            />
        );

        expect(screen.getByText('Group A')).toBeInTheDocument();
        expect(screen.getByText('Age')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('handles non-array filter values and selected-row state branch', () => {
        toolbarState.applyStringFilter = true;
        toolbarState.selectAllRows = true;

        render(
            <DataTable
                columns={[{ accessorKey: 'name', header: 'Name' }] as any}
                data={[{ name: 'Alice' }] as any}
                pageCount={undefined as any}
                filterableColumns={[{ id: 'name', title: 'Name', options: [] }] as any}
            />
        );

        expect(screen.getByText('Alice')).toBeInTheDocument();
    });
});
