import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import DashboardsTableShell from '@/components/shells/dashboards-table-shell';
import ProjectsTableShell from '@/components/shells/projects-table-shell';
import VisualizationsTableShell from '@/components/shells/visualizations-table-shell';

const {
    refresh,
    toastPromise,
    deleteDashboard,
    deleteProject,
    deleteVisualization,
    dispatch
} = vi.hoisted(() => ({
    refresh: vi.fn(),
    toastPromise: vi.fn((_promise: Promise<any>, cfg: any) => cfg.success()),
    deleteDashboard: vi.fn(() => Promise.resolve({})),
    deleteProject: vi.fn(() => Promise.resolve({})),
    deleteVisualization: vi.fn(() => Promise.resolve({})),
    dispatch: vi.fn()
}));

let latestDataTableProps: any = null;
let dispatchEnabled = true;

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh })
}));

vi.mock('sonner', () => ({
    toast: { promise: toastPromise }
}));

vi.mock('@/app/_actions/dashboard', () => ({
    deleteDashboard
}));

vi.mock('@/app/_actions/project', () => ({
    deleteProject
}));

vi.mock('@/app/_actions/visualization', () => ({
    deleteVisualization
}));

vi.mock('@/components/providers/active-project-provider', () => ({
    useActiveProjectDispatch: () => (dispatchEnabled ? dispatch : undefined)
}));

vi.mock('@/components/data-table/data-table', () => ({
    default: (props: any) => {
        latestDataTableProps = props;
        return <button onClick={props.deleteRowsAction}>trigger-bulk-delete</button>;
    }
}));

describe('table shell wrappers', () => {
    beforeEach(() => {
        latestDataTableProps = null;
        refresh.mockClear();
        toastPromise.mockClear();
        deleteDashboard.mockClear();
        deleteProject.mockClear();
        deleteVisualization.mockClear();
        dispatch.mockClear();
        dispatchEnabled = true;
    });

    it('passes expected props from dashboard shell to DataTable', async () => {
        render(<DashboardsTableShell data={[{ name: 'd1', description: 'x' } as any]} pageCount={3} />);

        expect(latestDataTableProps.newRowLink).toBe('/dashboards/new');
        expect(latestDataTableProps.pageCount).toBe(3);
        expect(latestDataTableProps.columns.length).toBeGreaterThan(0);

        const headerEl = latestDataTableProps.columns[0].header({
            table: {
                getIsAllPageRowsSelected: () => false,
                toggleAllPageRowsSelected: vi.fn()
            }
        });
        await act(async () => {
            headerEl.props.onCheckedChange(true);
        });

        await act(async () => {
            latestDataTableProps.deleteRowsAction();
        });
        expect(toastPromise).toHaveBeenCalled();
        await waitFor(() => {
            expect(deleteDashboard).toHaveBeenCalledWith('d1');
        });
    });

    it('updates active project state and triggers project bulk delete', async () => {
        render(<ProjectsTableShell data={[{ name: 'p1', isActive: true } as any]} pageCount={2} />);

        expect(dispatch).toHaveBeenCalledWith({ type: 'SET_ACTIVE_PROJECT', payload: true });
        expect(latestDataTableProps.newRowLink).toBe('/projects/new');

        const headerEl = latestDataTableProps.columns[0].header({
            table: {
                getIsAllPageRowsSelected: () => false,
                toggleAllPageRowsSelected: vi.fn()
            }
        });
        await act(async () => {
            headerEl.props.onCheckedChange(true);
        });

        await act(async () => {
            latestDataTableProps.deleteRowsAction();
        });
        await waitFor(() => {
            expect(deleteProject).toHaveBeenCalledWith('p1');
        });
    });

    it('handles select-all callbacks safely when table data is undefined', async () => {
        render(<DashboardsTableShell pageCount={0} />);
        const dashboardHeader = latestDataTableProps.columns[0].header({
            table: {
                getIsAllPageRowsSelected: () => false,
                toggleAllPageRowsSelected: vi.fn()
            }
        });
        await act(async () => {
            dashboardHeader.props.onCheckedChange(true);
        });

        render(<ProjectsTableShell pageCount={0} />);
        const projectsHeader = latestDataTableProps.columns[0].header({
            table: {
                getIsAllPageRowsSelected: () => false,
                toggleAllPageRowsSelected: vi.fn()
            }
        });
        await act(async () => {
            projectsHeader.props.onCheckedChange(true);
        });

        render(<VisualizationsTableShell pageCount={0} />);
        const visualizationsHeader = latestDataTableProps.columns[0].header({
            table: {
                getIsAllPageRowsSelected: () => false,
                toggleAllPageRowsSelected: vi.fn()
            }
        });
        await act(async () => {
            visualizationsHeader.props.onCheckedChange(true);
        });

        expect(deleteDashboard).not.toHaveBeenCalled();
    });

    it('skips active-project dispatch when provider dispatch is unavailable', () => {
        dispatchEnabled = false;
        render(<ProjectsTableShell data={[{ name: 'p1', isActive: true } as any]} pageCount={1} />);
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('handles visualization tags cell and bulk delete', async () => {
        render(
            <VisualizationsTableShell
                data={[{ name: 'v1', type: 'bar-chart', tags: ['a', 'b'] } as any]}
                pageCount={1}
            />
        );

        expect(latestDataTableProps.newRowLink).toBe('/visualizations/new');

        const tagCell = latestDataTableProps.columns.find((c: any) => c.accessorKey === 'tags').cell({
            cell: { getValue: () => ['x', 'y'] }
        });
        expect(tagCell).toBeTruthy();

        const headerEl = latestDataTableProps.columns[0].header({
            table: {
                getIsAllPageRowsSelected: () => false,
                toggleAllPageRowsSelected: vi.fn()
            }
        });
        await act(async () => {
            headerEl.props.onCheckedChange(true);
        });

        await act(async () => {
            latestDataTableProps.deleteRowsAction();
        });
        await waitFor(() => {
            expect(deleteVisualization).toHaveBeenCalledWith({ name: 'v1', type: 'bar-chart' });
        });
        expect(refresh).toHaveBeenCalled();
    });
});
