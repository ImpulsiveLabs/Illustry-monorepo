import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResizableDashboard from '@/components/shells/dashboard-shell';

const { push, updateDashboard } = vi.hoisted(() => ({
    push: vi.fn(),
    updateDashboard: vi.fn(() => Promise.resolve({}))
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push })
}));

vi.mock('@/app/_actions/dashboard', () => ({
    updateDashboard
}));

vi.mock('@/components/shells/hub-shell', () => ({
    default: () => <div data-testid="hub-shell" />
}));

vi.mock('react-grid-layout', () => ({
    WidthProvider: (Comp: any) => Comp,
    Responsive: ({ children, onLayoutChange, onDragStop, onBreakpointChange }: any) => (
        <div>
            <button
                onClick={() => {
                    const nextLayout = [{ i: '0', x: 1, y: 1, w: 2, h: 2 }];
                    onLayoutChange(nextLayout, { lg: nextLayout });
                    onDragStop(nextLayout);
                }}
            >
                change-layout
            </button>
            <button
                onClick={() => {
                    const nextLayout = [{ i: '0', x: 2, y: 2, w: 3, h: 3 }];
                    onLayoutChange(nextLayout, { md: nextLayout });
                }}
            >
                layout-without-lg
            </button>
            <button
                onClick={() => {
                    const nextLayout = [{ i: '0', x: 4, y: 4, w: 2, h: 2 }];
                    onLayoutChange(nextLayout, undefined as any);
                }}
            >
                layout-undefined
            </button>
            <button
                onClick={() => {
                    const nextLayout = [{ i: '0', x: 3, y: 3, w: 2, h: 2 }];
                    onDragStop(nextLayout);
                }}
            >
                change-layout-md
            </button>
            <button onClick={() => onBreakpointChange('md')}>
                set-md
            </button>
            {children}
        </div>
    )
}));

describe('ResizableDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

    it('persists layout when beforeunload fires after layout change', async () => {
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

        await user.click(screen.getByRole('button', { name: 'change-layout' }));
        fireEvent(window, new Event('beforeunload'));

        await waitFor(() => {
            expect(updateDashboard).toHaveBeenCalled();
        });
        expect(updateDashboard.mock.calls[0][0]).not.toHaveProperty('visualizations');
        expect(updateDashboard.mock.calls[0][0].layouts).toEqual([{ i: '0', x: 1, y: 1, w: 2, h: 2 }]);
    });

    it('does not persist on md drag-stop and handles non-lg layout payload', async () => {
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

        await user.click(screen.getByRole('button', { name: 'set-md' }));
        await user.click(screen.getByRole('button', { name: 'layout-without-lg' }));
        await user.click(screen.getByRole('button', { name: 'change-layout-md' }));

        expect(updateDashboard).not.toHaveBeenCalled();
    });

    it('skips persistence when no layout change happened', () => {
        render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    layouts: [],
                    visualizations: [{ name: 'Sales', type: 'bar-chart', data: {} }]
                } as any}
            />
        );

        fireEvent(window, new Event('beforeunload'));
        expect(updateDashboard).not.toHaveBeenCalled();
    });

    it('persists lg fallback layout when responsive payload omits lg', async () => {
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

        await user.click(screen.getByRole('button', { name: 'layout-without-lg' }));
        await user.click(screen.getByRole('button', { name: 'change-layout' }));
        fireEvent(window, new Event('beforeunload'));

        await waitFor(() => {
            expect(updateDashboard).toHaveBeenCalled();
        });
    });

    it('supports predefined layouts and undefined allLayouts payloads', async () => {
        const user = userEvent.setup();
        const { unmount } = render(
            <ResizableDashboard
                dashboard={{
                    name: 'dash',
                    layouts: [{ i: '0', x: 0, y: 0, w: 2, h: 2 }],
                    visualizations: [{ name: 'Sales', type: 'bar-chart', data: {} }]
                } as any}
            />
        );

        await user.click(screen.getByRole('button', { name: 'layout-undefined' }));
        await user.click(screen.getByRole('button', { name: 'change-layout' }));
        unmount();

        await waitFor(() => {
            expect(updateDashboard).toHaveBeenCalled();
        });
    });
});
