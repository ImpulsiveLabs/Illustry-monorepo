import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DataTable from '@/components/data-table/data-table';

const push = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
    usePathname: () => '/projects',
    useSearchParams: () => ({
        get: (key: string) => {
            if (key === 'page') return '2';
            if (key === 'per_page') return '5';
            if (key === 'sort') return 'name.desc';
            return null;
        },
        toString: () => 'page=2&per_page=5&sort=name.desc&status=active',
        forEach: (cb: (value: string, key: string) => void) => {
            cb('2', 'page');
            cb('5', 'per_page');
            cb('name.desc', 'sort');
            cb('active', 'status');
        }
    })
}));

vi.mock('@/components/data-table/data-table-toolbar', () => ({
    default: () => <div data-testid="toolbar">toolbar</div>
}));

vi.mock('@/components/data-table/data-table-pagination', () => ({
    default: () => <div data-testid="pagination">pagination</div>
}));

describe('DataTable', () => {
    beforeEach(() => {
        push.mockClear();
    });

    it('renders no-results state and syncs pagination/sort/filter query params', async () => {
        render(
            <DataTable
                columns={[{ accessorKey: 'name', header: 'Name' }] as any}
                data={[]}
                pageCount={2}
                filterableColumns={[{ id: 'status', title: 'Status', options: [] }] as any}
            />
        );

        expect(screen.getByText('No results.')).toBeInTheDocument();
        expect(screen.getByTestId('toolbar')).toBeInTheDocument();
        expect(screen.getByTestId('pagination')).toBeInTheDocument();

        await waitFor(() => {
            expect(push).toHaveBeenCalled();
        });
        expect(push.mock.calls.some((c) => String(c[0]).includes('sort=name.desc'))).toBe(true);
        expect(push.mock.calls.some((c) => String(c[0]).includes('status'))).toBe(true);
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
});
