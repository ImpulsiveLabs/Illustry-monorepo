import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor, screen } from '@testing-library/react';
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
vi.mock('@/components/ui/confirm-action-dialog', () => ({
    default: ({ open, onConfirm }: any) => (open ? <button onClick={onConfirm}>confirm-delete</button> : null)
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

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('passes expected props from dashboard shell to DataTable', async () => {
        render(<DashboardsTableShell data={[{ name: 'd1', description: 'x' } as any]} pageCount={3} />);

        expect(latestDataTableProps.newRowLink).toBe('/dashboards?modal=new');
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
        await act(async () => {
            screen.getByRole('button', { name: 'confirm-delete' }).click();
        });
        expect(toastPromise).toHaveBeenCalled();
        await waitFor(() => {
            expect(deleteDashboard).toHaveBeenCalledWith('d1');
        });
    });

    it('updates active project state and triggers project bulk delete', async () => {
        render(<ProjectsTableShell data={[{ name: 'p1', isActive: true } as any]} pageCount={2} />);

        expect(dispatch).toHaveBeenCalledWith({ type: 'SET_ACTIVE_PROJECT', payload: true });
        expect(latestDataTableProps.newRowLink).toBe('/projects?modal=new');

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
        await act(async () => {
            screen.getByRole('button', { name: 'confirm-delete' }).click();
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

    it('refreshes project tables from project realtime events, focus, and reconnect', () => {
        vi.useFakeTimers();
        process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = 'http://backend.local';
        Object.defineProperty(document, 'visibilityState', {
            value: 'visible',
            configurable: true
        });

        const sockets: Array<{
            url: string;
            onmessage?: (event: { data: string }) => void;
            onclose?: () => void;
            close: ReturnType<typeof vi.fn>;
        }> = [];
        class MockWebSocket {
            static CONNECTING = 0;

            static OPEN = 1;

            url: string;

            readyState = MockWebSocket.OPEN;

            onmessage?: (event: { data: string }) => void;

            onclose?: () => void;

            close = vi.fn();

            constructor(url: string) {
                this.url = url;
                sockets.push(this);
            }
        }
        vi.stubGlobal('WebSocket', MockWebSocket);

        const rendered = render(<ProjectsTableShell data={[{ name: 'p1', isActive: true } as any]} pageCount={1} />);

        expect(sockets[0].url).toContain('/api/realtime?resource=project');
        expect(sockets[0].url).toContain('shareId=projects');

        act(() => {
            sockets[0].onmessage?.({ data: JSON.stringify({ action: 'created' }) });
        });
        expect(refresh).toHaveBeenCalledTimes(1);

        act(() => {
            sockets[0].onmessage?.({ data: JSON.stringify({ type: 'connected' }) });
            sockets[0].onmessage?.({ data: 'not-json' });
        });
        expect(refresh).toHaveBeenCalledTimes(1);

        act(() => {
            window.dispatchEvent(new Event('focus'));
        });
        expect(refresh).toHaveBeenCalledTimes(2);

        act(() => {
            sockets[0].onclose?.();
            vi.advanceTimersByTime(2000);
        });
        expect(sockets).toHaveLength(2);

        rendered.unmount();
        expect(sockets[1].close).toHaveBeenCalled();
    });

    it('refreshes dashboard and visualization tables from user realtime events', () => {
        vi.useFakeTimers();
        process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = 'http://backend.local';

        const sockets: Array<{
            url: string;
            onmessage?: (event: { data: string }) => void;
            close: ReturnType<typeof vi.fn>;
        }> = [];
        class MockWebSocket {
            static CONNECTING = 0;

            static OPEN = 1;

            url: string;

            readyState = MockWebSocket.OPEN;

            onmessage?: (event: { data: string }) => void;

            close = vi.fn();

            constructor(url: string) {
                this.url = url;
                sockets.push(this);
            }
        }
        vi.stubGlobal('WebSocket', MockWebSocket);

        const dashboards = render(<DashboardsTableShell data={[{ name: 'd1', description: 'x' } as any]} pageCount={1} />);

        expect(sockets[0].url).toContain('/api/realtime?resource=user');
        expect(sockets[0].url).toContain('shareId=me');

        act(() => {
            sockets[0].onmessage?.({ data: JSON.stringify({ action: 'created' }) });
            sockets[0].onmessage?.({ data: JSON.stringify({ type: 'connected' }) });
            sockets[0].onmessage?.({ data: 'not-json' });
        });
        expect(refresh).toHaveBeenCalledTimes(1);

        dashboards.unmount();
        expect(sockets[0].close).toHaveBeenCalled();

        const visualizations = render(
            <VisualizationsTableShell
                data={[{ name: 'v1', type: 'bar-chart', tags: [] } as any]}
                pageCount={1}
            />
        );

        expect(sockets[1].url).toContain('/api/realtime?resource=user');
        expect(sockets[1].url).toContain('shareId=me');

        act(() => {
            sockets[1].onmessage?.({ data: JSON.stringify({ action: 'updated' }) });
            sockets[1].onmessage?.({ data: JSON.stringify({ action: 'theme-updated' }) });
            sockets[1].onmessage?.({ data: JSON.stringify({ action: 'deleted' }) });
        });
        expect(refresh).toHaveBeenCalledTimes(4);

        visualizations.unmount();
        expect(sockets[1].close).toHaveBeenCalled();
    });

    it('handles visualization tags cell and bulk delete', async () => {
        render(
            <VisualizationsTableShell
                data={[{ name: 'v1', type: 'bar-chart', tags: ['a', 'b'] } as any]}
                pageCount={1}
            />
        );

        expect(latestDataTableProps.newRowLink).toBe('/visualizations?modal=new');

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
        await act(async () => {
            screen.getByRole('button', { name: 'confirm-delete' }).click();
        });
        await waitFor(() => {
            expect(deleteVisualization).toHaveBeenCalledWith({ name: 'v1', type: 'bar-chart' });
        });
        expect(refresh).toHaveBeenCalled();
    });
});
