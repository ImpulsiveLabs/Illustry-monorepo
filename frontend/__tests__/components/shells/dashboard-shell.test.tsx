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
    Responsive: ({ children, onLayoutChange }: any) => (
        <div>
            <button onClick={() => onLayoutChange([{ i: '0', x: 1, y: 1, w: 2, h: 2 }])}>change-layout</button>
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
        await user.click(screen.getByText('Sales (Bar-chart Chart)'));
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
});
