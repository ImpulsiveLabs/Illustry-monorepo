import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResizableDashboard from '@/components/shells/dashboard-shell';

const {
    push, replace, refresh, updateDashboard, shareDashboard,
    getServerDashboardExportPayload, getServerDashboardPreviewDataUrl, downloadExportFromApi
} = vi.hoisted(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    updateDashboard: vi.fn(() => Promise.resolve({})),
    shareDashboard: vi.fn(() => Promise.resolve({ shareId: 'dash_shared' })),
    downloadExportFromApi: vi.fn(async () => ({
        filename: 'dash.zip',
        bundled: true
    })),
    getServerDashboardExportPayload: vi.fn(() => [{
        title: 'Sales (Bar Chart)',
        option: { series: [{ type: 'bar', data: [1, 2] }] },
        width: 640,
        height: 360
    }]),
    getServerDashboardPreviewDataUrl: vi.fn(() => 'data:image/png;base64,dashboard-preview'),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push, replace, refresh })
}));

vi.mock('@/app/_actions/dashboard', () => ({
    updateDashboard,
    shareDashboard
}));

vi.mock('@/lib/chart-export', () => ({
    getServerDashboardExportPayload,
    getServerDashboardPreviewDataUrl,
    downloadExportFromApi
}));

vi.mock('@/components/shells/hub-shell', () => ({
    default: () => <div data-testid="hub-shell" />
}));

vi.mock('@/components/export/export-download-dialog', () => ({
    default: ({ open, onSubmit }: any) => (open ? (
        <button
            type="button"
            onClick={() => onSubmit({
                formats: ['png', 'svg'],
                sheetName: 'Dashboard',
                cellRange: 'B2:K19'
            })}
        >
            Mock dashboard download
        </button>
    ) : null)
}));

describe('ResizableDashboard', () => {
    beforeEach(() => {
        delete process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL;
        window.sessionStorage.setItem('illustry:realtime-client-id', 'test-client');
        vi.clearAllMocks();
        vi.unstubAllGlobals();
        vi.stubGlobal('ResizeObserver', class {
            observe() {}

            unobserve() {}

            disconnect() {}
        });
    });

    it('renders dashboard cards and navigates to visualization hub on title click', async () => {
        const user = userEvent.setup();
        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    layouts: [],
                    visualizations: [
                        { name: 'Sales', type: 'bar-chart', data: {} },
                        { name: 'Nodes', type: 'sankey', data: {} }
                    ]
                } as any}
            />
        );

        expect(screen.getAllByTestId('hub-shell')).toHaveLength(2);
        await user.click(screen.getByText('Sales (Bar Chart)'));
        expect(push).toHaveBeenCalledWith('/visualizationhub?name=Sales&type=bar-chart');
    });

    it('opens dashboard-propagated shared visualizations from external dashboards', async () => {
        const user = userEvent.setup();
        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    shareId: 'dash_shared',
                    isExternal: true,
                    currentUserRole: 'editor',
                    layouts: [],
                    visualizations: [
                        { name: 'Sales', type: 'bar-chart', shareId: 'viz_shared', data: {} }
                    ]
                } as any}
            />
        );

        await user.click(screen.getByText('Sales (Bar Chart)'));
        expect(push).toHaveBeenCalledWith('/visualizationhub?share=viz_shared');
    });

    it('opens inherited dashboard visualizations through the dashboard share context', async () => {
        const user = userEvent.setup();
        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    shareId: 'dash_shared',
                    isExternal: true,
                    currentUserRole: 'viewer',
                    layouts: [],
                    visualizations: [
                        {
                            name: 'Sales',
                            type: 'bar-chart',
                            accessType: 'inherited',
                            sourceDashboardId: 'dash_shared',
                            data: {}
                        }
                    ]
                } as any}
            />
        );

        await user.click(screen.getByText('Sales (Bar Chart)'));
        expect(push).toHaveBeenCalledWith('/visualizationhub?dashboardShare=dash_shared&name=Sales&type=bar-chart');
    });

    it('persists the canonical fixed layout when the save layout button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    layouts: [],
                    visualizations: [{ name: 'Sales', type: 'bar-chart', data: {} }]
                } as any}
            />
        );

        await user.click(screen.getByRole('button', { name: /Save layout/ }));

        await waitFor(() => {
            expect(updateDashboard).toHaveBeenCalled();
        });
        expect(updateDashboard.mock.calls[0][0]).toEqual({
            name: 'dash',
            shareId: undefined,
            realtimeClientId: 'test-client',
            layouts: [{ i: '0', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 2 }]
        });
    });

    it('renders fixed CSS grid tiles without transform-grid translated state', () => {
        const { container } = render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    layouts: [{ i: '0', x: 11, y: 0, w: 12, h: 12 }],
                    visualizations: [
                        { name: 'Sales', type: 'bar-chart', data: {} },
                        { name: 'Nodes', type: 'sankey', data: {} }
                    ]
                } as any}
            />
        );

        expect(screen.getByTestId('dashboard-fixed-grid')).toHaveClass('grid');
        expect(container.querySelector('.react-grid-item')).not.toBeInTheDocument();
        expect(container.querySelector('.draggable-corner')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Move Sales')).toHaveAttribute('draggable', 'true');
        expect(screen.getAllByTestId('hub-shell')).toHaveLength(2);
    });

    it('drags cards by swapping only fixed dashboard slots', async () => {
        const user = userEvent.setup();
        const dataTransfer = {
            value: '',
            effectAllowed: '',
            dropEffect: '',
            setData: vi.fn((_type: string, value: string) => {
                dataTransfer.value = value;
            }),
            getData: vi.fn(() => dataTransfer.value)
        };

        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    layouts: [],
                    visualizations: [
                        { name: 'Sales', type: 'bar-chart', data: {} },
                        { name: 'Nodes', type: 'sankey', data: {} }
                    ]
                } as any}
            />
        );

        fireEvent.dragStart(screen.getByLabelText('Move Sales'), { dataTransfer });
        fireEvent.dragOver(screen.getByTestId('dashboard-card-1'), { dataTransfer });
        fireEvent.drop(screen.getByTestId('dashboard-card-1'), { dataTransfer });
        await user.click(screen.getByRole('button', { name: /Save layout/ }));

        await waitFor(() => {
            expect(updateDashboard).toHaveBeenCalled();
        });
        expect(updateDashboard.mock.calls[0][0].layouts).toEqual([
            { i: '0', x: 4, y: 0, w: 4, h: 4, minW: 2, minH: 2 },
            { i: '1', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 2 }
        ]);
    });

    it('keeps external viewers read-only with no drag or layout save affordance', () => {
        const dataTransfer = {
            value: '',
            effectAllowed: '',
            dropEffect: '',
            setData: vi.fn((_type: string, value: string) => {
                dataTransfer.value = value;
            }),
            getData: vi.fn(() => dataTransfer.value)
        };

        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    shareId: 'dash_shared',
                    isExternal: true,
                    currentUserRole: 'viewer',
                    layouts: [],
                    visualizations: [
                        { name: 'Sales', type: 'bar-chart', shareId: 'viz_shared', data: {} },
                        { name: 'Nodes', type: 'sankey', shareId: 'viz_nodes', data: {} }
                    ]
                } as any}
            />
        );

        expect(screen.queryByRole('button', { name: /Save layout/ })).not.toBeInTheDocument();
        expect(screen.getByLabelText('Open Sales')).toHaveAttribute('draggable', 'false');
        fireEvent.dragStart(screen.getByLabelText('Open Sales'), { dataTransfer });
        fireEvent.drop(screen.getByTestId('dashboard-card-1'), { dataTransfer });
        expect(updateDashboard).not.toHaveBeenCalled();
    });

    it('renders at most six dashboard visualizations', () => {
        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    layouts: [],
                    visualizations: Array.from({ length: 7 }, (_, index) => ({
                        name: `Viz ${index + 1}`,
                        type: 'bar-chart',
                        data: {}
                    }))
                } as any}
            />
        );

        expect(screen.getAllByTestId('hub-shell')).toHaveLength(6);
        expect(screen.queryByText('Viz 7 (Bar Chart)')).not.toBeInTheDocument();
    });

    it('keeps save disabled when there are no visualizations', () => {
        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    layouts: [],
                    visualizations: []
                } as any}
            />
        );

        expect(screen.getByRole('button', { name: /Save layout/ })).toBeDisabled();
        expect(updateDashboard).not.toHaveBeenCalled();
    });

    it('opens the dashboard export modal and sends a multi-format request to the backend', async () => {
        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    layouts: [],
                    visualizations: [{ name: 'Sales', type: 'bar-chart', data: {} }]
                } as any}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Export dashboard' }));
        fireEvent.click(screen.getByRole('button', { name: 'Mock dashboard download' }));

        await waitFor(() => {
            expect(downloadExportFromApi).toHaveBeenCalled();
        });
        expect(downloadExportFromApi.mock.calls[0][0]).toMatchObject({
            endpoint: '/api/export/dashboard',
            fallbackFilename: 'illustry-dashboard-export',
            payload: {
                name: 'dash',
                formats: ['png', 'svg'],
                sheetName: 'Dashboard',
                cellRange: 'B2:K19'
            }
        });
        expect(getServerDashboardExportPayload).toHaveBeenCalled();
    });

    it('normalizes predefined layouts into fixed slots before saving', async () => {
        const user = userEvent.setup();
        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    layouts: [{ i: '0', x: 11, y: 0, w: 12, h: 12 }],
                    visualizations: [
                        { name: 'Sales', type: 'bar-chart', data: {} },
                        { name: 'Nodes', type: 'sankey', data: {} }
                    ]
                } as any}
            />
        );

        await user.click(screen.getByRole('button', { name: /Save layout/ }));

        await waitFor(() => {
            expect(updateDashboard).toHaveBeenCalled();
        });
        expect(updateDashboard.mock.calls[0][0].layouts).toEqual([
            { i: '0', x: 8, y: 0, w: 4, h: 4, minW: 2, minH: 2 },
            { i: '1', x: 4, y: 0, w: 4, h: 4, minW: 2, minH: 2 }
        ]);
    });

    it('subscribes to shared dashboards over websocket and refreshes on live updates', async () => {
        const sockets: Array<{
            url: string;
            close: ReturnType<typeof vi.fn>;
            onmessage?: (event: { data: string }) => void;
        }> = [];

        class MockWebSocket {
            static CONNECTING = 0;

            static OPEN = 1;

            url: string;

            readyState = MockWebSocket.OPEN;

            close = vi.fn();

            onmessage?: (event: { data: string }) => void;

            onclose?: () => void;

            constructor(url: string) {
                this.url = url;
                sockets.push(this);
            }
        }

        vi.stubGlobal('WebSocket', MockWebSocket);
        process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = 'https://api.example.com';

        const { unmount } = render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    shareId: 'dash_shared',
                    layouts: [],
                    visualizations: [{ name: 'Sales', type: 'bar-chart', data: {} }]
                } as any}
            />
        );

        await waitFor(() => {
            expect(sockets.length).toBeGreaterThan(0);
        });
        const socket = sockets[sockets.length - 1];
        expect(socket.url).toBe('wss://api.example.com/api/realtime?resource=dashboard&shareId=dash_shared&clientId=test-client');

        socket.onmessage?.({ data: JSON.stringify({ type: 'connected' }) });
        expect(refresh).not.toHaveBeenCalled();

        socket.onmessage?.({ data: JSON.stringify({ action: 'updated' }) });
        expect(refresh).toHaveBeenCalledTimes(1);

        socket.onmessage?.({ data: JSON.stringify({ action: 'updated', originClientId: 'test-client' }) });
        expect(refresh).toHaveBeenCalledTimes(1);

        socket.onmessage?.({ data: JSON.stringify({ action: 'deleted' }) });
        expect(replace).toHaveBeenCalledWith('/');

        unmount();
        expect(socket.close).toHaveBeenCalled();
    });

    it('subscribes owner-only dashboards to the user realtime channel for nonshared layout changes', async () => {
        const sockets: Array<{
            url: string;
            close: ReturnType<typeof vi.fn>;
            onmessage?: (event: { data: string }) => void;
        }> = [];

        class MockWebSocket {
            static CONNECTING = 0;

            static OPEN = 1;

            url: string;

            readyState = MockWebSocket.OPEN;

            close = vi.fn();

            onmessage?: (event: { data: string }) => void;

            onclose?: () => void;

            constructor(url: string) {
                this.url = url;
                sockets.push(this);
            }
        }

        vi.stubGlobal('WebSocket', MockWebSocket);
        process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = 'https://api.example.com';

        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    layouts: [],
                    visualizations: [{ name: 'Sales', type: 'bar-chart', data: {} }]
                } as any}
            />
        );

        await waitFor(() => {
            expect(sockets.length).toBeGreaterThan(0);
        });

        const socket = sockets[sockets.length - 1];
        expect(socket.url).toBe('wss://api.example.com/api/realtime?resource=user&shareId=me&clientId=test-client');
        socket.onmessage?.({ data: JSON.stringify({ action: 'updated' }) });
        expect(refresh).toHaveBeenCalledTimes(1);
        socket.onmessage?.({ data: JSON.stringify({ action: 'updated', originClientId: 'test-client' }) });
        expect(refresh).toHaveBeenCalledTimes(1);
    });
});
