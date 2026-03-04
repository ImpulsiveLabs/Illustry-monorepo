import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import DashboardsTableShell from '@/components/shells/dashboards-table-shell';
import ProjectsTableShell from '@/components/shells/projects-table-shell';
import VisualizationsTableShell from '@/components/shells/visualizations-table-shell';

const {
    refresh,
    toastPromise,
    deleteDashboard,
    deleteProject,
    deleteVisualization,
    catchError,
    dispatch
} = vi.hoisted(() => ({
    refresh: vi.fn(),
    toastPromise: vi.fn((_promise: Promise<any>, cfg: any) => cfg.success?.()),
    deleteDashboard: vi.fn(() => Promise.resolve({})),
    deleteProject: vi.fn(() => Promise.resolve({})),
    deleteVisualization: vi.fn(() => Promise.resolve({})),
    catchError: vi.fn(() => 'caught'),
    dispatch: vi.fn()
}));

let latestDataTableProps: any = null;

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh })
}));

vi.mock('sonner', () => ({ toast: { promise: toastPromise } }));
vi.mock('@/app/_actions/dashboard', () => ({ deleteDashboard }));
vi.mock('@/app/_actions/project', () => ({ deleteProject }));
vi.mock('@/app/_actions/visualization', () => ({ deleteVisualization }));
vi.mock('@/components/providers/active-project-provider', () => ({ useActiveProjectDispatch: () => dispatch }));
vi.mock('@/components/data-table/data-table', () => ({
    default: (props: any) => {
        latestDataTableProps = props;
        return <div>table</div>;
    }
}));
vi.mock('@/lib/utils', async () => {
    const actual = await vi.importActual<any>('@/lib/utils');
    return { ...actual, catchError };
});

const walk = (node: any, predicate: (el: any) => boolean): any => {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    const children = node.props?.children;
    if (Array.isArray(children)) {
        for (const child of children) {
            const hit = walk(child, predicate);
            if (hit) return hit;
        }
    } else if (children) {
        return walk(children, predicate);
    }
    return null;
};

describe('table shell action branches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        latestDataTableProps = null;
    });

    it('covers dashboard action cell links/delete and bulk error callback', async () => {
        render(<DashboardsTableShell data={[{ name: 'd1', description: 'x' } as any]} pageCount={1} />);
        const selectHeader = latestDataTableProps.columns[0].header({
            table: { getIsAllPageRowsSelected: () => false, toggleAllPageRowsSelected: vi.fn() }
        });
        await act(async () => {
            selectHeader.props.onCheckedChange(true);
            selectHeader.props.onCheckedChange(true);
            selectHeader.props.onCheckedChange(true);
            selectHeader.props.onCheckedChange(true);
        });

        const selectCell = latestDataTableProps.columns[0].cell({
            row: { getIsSelected: () => false, toggleSelected: vi.fn(), original: { name: 'd1' } }
        });
        await act(async () => {
            selectCell.props.onCheckedChange(true);
            selectCell.props.onCheckedChange(false);
        });

        const createdAtCell = latestDataTableProps.columns.find((c: any) => c.accessorKey === 'createdAt').cell({
            cell: { getValue: () => new Date('2026-01-01') }
        });
        const updatedAtCell = latestDataTableProps.columns.find((c: any) => c.accessorKey === 'updatedAt').cell({
            cell: { getValue: () => new Date('2026-01-02') }
        });
        expect(createdAtCell).toBeTruthy();
        expect(updatedAtCell).toBeTruthy();

        const namedHeaders = latestDataTableProps.columns
            .filter((c: any) => ['name', 'description', 'createdAt', 'updatedAt'].includes(c.accessorKey))
            .map((c: any) => c.header({ column: {} }));
        expect(namedHeaders.every(Boolean)).toBe(true);

        const actionsCol = latestDataTableProps.columns.find((c: any) => c.id === 'actions');
        const row = { original: { name: 'd1' }, toggleSelected: vi.fn() };
        const cellEl = actionsCol.cell({ row });

        const viewLink = walk(cellEl, (el) => el?.props?.href === '/dashboardhub?name=d1');
        const editLink = walk(cellEl, (el) => el?.props?.href === '/dashboards/d1');
        const deleteItem = walk(cellEl, (el) => typeof el?.props?.onClick === 'function' && String(el?.props?.children).includes('Delete'));

        expect(viewLink).toBeTruthy();
        expect(editLink).toBeTruthy();
        await act(async () => {
            deleteItem.props.onClick();
        });

        await waitFor(() => {
            expect(row.toggleSelected).toHaveBeenCalledWith(false);
            expect(deleteDashboard).toHaveBeenCalledWith('d1');
        });
        const rowDeleteCfg = toastPromise.mock.calls.at(-1)?.[1];
        rowDeleteCfg.error(new Error('row-delete-failed'));
        expect(catchError).toHaveBeenCalled();

        await act(async () => {
            latestDataTableProps.deleteRowsAction();
        });

        const cfg = toastPromise.mock.calls.at(-1)?.[1];
        cfg.error(new Error('boom'));
        expect(catchError).toHaveBeenCalled();
    });

    it('covers project action delete and bulk error callback', async () => {
        render(<ProjectsTableShell data={[{ name: 'p1', isActive: false } as any]} pageCount={1} />);
        const selectHeader = latestDataTableProps.columns[0].header({
            table: { getIsAllPageRowsSelected: () => false, toggleAllPageRowsSelected: vi.fn() }
        });
        await act(async () => {
            selectHeader.props.onCheckedChange(true);
            selectHeader.props.onCheckedChange(true);
        });

        const selectCell = latestDataTableProps.columns[0].cell({
            row: { getIsSelected: () => false, toggleSelected: vi.fn(), original: { name: 'p1' } }
        });
        await act(async () => {
            selectCell.props.onCheckedChange(true);
            selectCell.props.onCheckedChange(false);
        });

        const createdAtCell = latestDataTableProps.columns.find((c: any) => c.accessorKey === 'createdAt').cell({
            cell: { getValue: () => new Date('2026-01-01') }
        });
        const updatedAtCell = latestDataTableProps.columns.find((c: any) => c.accessorKey === 'updatedAt').cell({
            cell: { getValue: () => new Date('2026-01-02') }
        });
        const activeCell = latestDataTableProps.columns.find((c: any) => c.accessorKey === 'isActive').cell({
            cell: { getValue: () => true }
        });
        const inactiveCell = latestDataTableProps.columns.find((c: any) => c.accessorKey === 'isActive').cell({
            cell: { getValue: () => false }
        });
        expect(createdAtCell).toBeTruthy();
        expect(updatedAtCell).toBeTruthy();
        expect(activeCell).toBe('active');
        expect(inactiveCell).toBe('not active');

        const namedHeaders = latestDataTableProps.columns
            .filter((c: any) => ['name', 'description', 'createdAt', 'updatedAt', 'isActive'].includes(c.accessorKey))
            .map((c: any) => c.header({ column: {} }));
        expect(namedHeaders.every(Boolean)).toBe(true);

        const actionsCol = latestDataTableProps.columns.find((c: any) => c.id === 'actions');
        const row = { original: { name: 'p1' }, toggleSelected: vi.fn() };
        const cellEl = actionsCol.cell({ row });

        const editLink = walk(cellEl, (el) => el?.props?.href === '/projects/p1');
        const deleteItem = walk(cellEl, (el) => typeof el?.props?.onClick === 'function' && String(el?.props?.children).includes('Delete'));

        expect(editLink).toBeTruthy();
        await act(async () => {
            deleteItem.props.onClick();
        });

        await waitFor(() => {
            expect(row.toggleSelected).toHaveBeenCalledWith(false);
            expect(deleteProject).toHaveBeenCalledWith('p1');
        });
        const rowDeleteCfg = toastPromise.mock.calls.at(-1)?.[1];
        rowDeleteCfg.error(new Error('row-delete-failed'));
        expect(catchError).toHaveBeenCalled();

        await act(async () => {
            latestDataTableProps.deleteRowsAction();
        });

        const cfg = toastPromise.mock.calls.at(-1)?.[1];
        cfg.error(new Error('boom'));
        expect(catchError).toHaveBeenCalled();
    });

    it('covers projects dispatch fallback when data is undefined', () => {
        render(<ProjectsTableShell pageCount={0} />);
        expect(dispatch).toHaveBeenCalledWith({ type: 'SET_ACTIVE_PROJECT', payload: false });
    });

    it('covers visualization action delete/view and tags string/null branches', async () => {
        render(
            <VisualizationsTableShell
                data={[
                    { name: 'v1', type: 'bar-chart', tags: 'single' } as any,
                    { name: 'v2', type: 'line-chart', tags: ['x'] } as any,
                    { name: 'v3', type: 'bar-chart', tags: ['y'] } as any
                ]}
                pageCount={1}
            />
        );
        const selectHeader = latestDataTableProps.columns[0].header({
            table: { getIsAllPageRowsSelected: () => false, toggleAllPageRowsSelected: vi.fn() }
        });
        await act(async () => {
            selectHeader.props.onCheckedChange(true);
            selectHeader.props.onCheckedChange(true);
        });

        const selectCell = latestDataTableProps.columns[0].cell({
            row: { getIsSelected: () => false, toggleSelected: vi.fn(), original: { name: 'v1', type: 'bar-chart' } }
        });
        await act(async () => {
            selectCell.props.onCheckedChange(true);
            selectCell.props.onCheckedChange(false);
        });

        const tagsCol = latestDataTableProps.columns.find((c: any) => c.accessorKey === 'tags');
        expect(tagsCol.cell({ cell: { getValue: () => 'single' } })).toBeTruthy();
        expect(tagsCol.cell({ cell: { getValue: () => ['x', 'y'] } })).toBeTruthy();
        expect(tagsCol.cell({ cell: { getValue: () => null } })).toBeNull();

        const createdAtCell = latestDataTableProps.columns.find((c: any) => c.accessorKey === 'createdAt').cell({
            cell: { getValue: () => new Date('2026-01-01') }
        });
        const updatedAtCell = latestDataTableProps.columns.find((c: any) => c.accessorKey === 'updatedAt').cell({
            cell: { getValue: () => new Date('2026-01-02') }
        });
        expect(createdAtCell).toBeTruthy();
        expect(updatedAtCell).toBeTruthy();

        const namedHeaders = latestDataTableProps.columns
            .filter((c: any) => ['name', 'description', 'type', 'tags', 'createdAt', 'updatedAt'].includes(c.accessorKey))
            .map((c: any) => c.header({ column: {} }));
        expect(namedHeaders.every(Boolean)).toBe(true);

        const actionsCol = latestDataTableProps.columns.find((c: any) => c.id === 'actions');
        const row = { original: { name: 'v1', type: 'bar-chart' }, toggleSelected: vi.fn() };
        const cellEl = actionsCol.cell({ row });

        const viewLink = walk(cellEl, (el) => el?.props?.href === '/visualizationhub?name=v1&type=bar-chart');
        const deleteItem = walk(cellEl, (el) => typeof el?.props?.onClick === 'function' && String(el?.props?.children).includes('Delete'));

        expect(viewLink).toBeTruthy();
        await act(async () => {
            deleteItem.props.onClick();
        });

        await waitFor(() => {
            expect(row.toggleSelected).toHaveBeenCalledWith(false);
            expect(deleteVisualization).toHaveBeenCalledWith({ name: 'v1', type: 'bar-chart' });
        });
        const rowDeleteCfg = toastPromise.mock.calls.at(-1)?.[1];
        rowDeleteCfg.error(new Error('row-delete-failed'));
        expect(catchError).toHaveBeenCalled();

        await act(async () => {
            latestDataTableProps.deleteRowsAction();
        });

        const cfg = toastPromise.mock.calls.at(-1)?.[1];
        cfg.error(new Error('boom'));
        expect(catchError).toHaveBeenCalled();
    });
});
