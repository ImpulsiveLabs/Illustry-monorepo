import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HubShell from '@/components/shells/hub-shell';

vi.mock('@/components/ui/fallback', () => ({ default: () => <div>fallback</div> }));

vi.mock('@/components/shells/hierarchical-edge-bundling/hierarchical-edge-bundling-shell', () => ({ default: () => <div data-testid="heb" /> }));
vi.mock('@/components/shells/forced-layout-graph/forced-layout-graph-shell', () => ({ default: () => <div data-testid="flg" /> }));
vi.mock('@/components/shells/sankey/sankey-shell', () => ({ default: () => <div data-testid="sankey" /> }));
vi.mock('@/components/shells/calendar/calendar-shell', () => ({ default: () => <div data-testid="calendar" /> }));
vi.mock('@/components/shells/wordcloud/wordcloud-shell', () => ({ default: () => <div data-testid="word-cloud" /> }));
vi.mock('@/components/shells/matrix/matrix-shell', () => ({ default: () => <div data-testid="matrix" /> }));
vi.mock('@/components/shells/axis/axis-shell', () => ({ default: ({ type }: any) => <div data-testid={`axis-${type}`} /> }));
vi.mock('@/components/shells/pie-chart/piechart-shell', () => ({ default: () => <div data-testid="pie-chart" /> }));
vi.mock('@/components/shells/funnel/funnel-shell', () => ({ default: () => <div data-testid="funnel" /> }));
vi.mock('@/components/shells/scatter/scatter-shell', () => ({ default: () => <div data-testid="scatter" /> }));
vi.mock('@/components/shells/treemap/treemap-shell', () => ({ default: () => <div data-testid="treemap" /> }));
vi.mock('@/components/shells/sunburst/sunburst-shell', () => ({ default: () => <div data-testid="sunburst" /> }));
vi.mock('@/components/shells/timeline/timeline-shell', () => ({ default: () => <div data-testid="timeline" /> }));

const renderType = (type: string) => render(
    <HubShell data={{ type, data: {} } as any} fullScreen={false} filter={false} legend={false} />
);

describe('HubShell', () => {
    it('renders each visualization shell branch', () => {
        const cases: Array<[string, string]> = [
            ['hierarchical-edge-bundling', 'heb'],
            ['force-directed-graph', 'flg'],
            ['sankey', 'sankey'],
            ['calendar', 'calendar'],
            ['word-cloud', 'word-cloud'],
            ['matrix', 'matrix'],
            ['line-chart', 'axis-line'],
            ['bar-chart', 'axis-bar'],
            ['pie-chart', 'pie-chart'],
            ['funnel', 'funnel'],
            ['scatter', 'scatter'],
            ['treemap', 'treemap'],
            ['sunburst', 'sunburst'],
            ['timeline', 'timeline']
        ];

        for (const [type, testId] of cases) {
            const view = renderType(type);
            expect(screen.getByTestId(testId)).toBeInTheDocument();
            view.unmount();
        }
    });

    it('returns empty for unknown type or missing data', () => {
        const unknown = render(<HubShell data={{ type: 'unknown', data: {} } as any} fullScreen={false} filter={false} legend={false} />);
        expect(unknown.container.firstChild).toHaveTextContent('');
        unknown.unmount();

        const missing = render(<HubShell data={null} fullScreen={false} filter={false} legend={false} />);
        expect(missing.container.firstChild).toHaveTextContent('');
    });

    it('renders fullscreen container class branch', () => {
        const view = render(
            <HubShell
                data={{ type: 'sankey', data: {} } as any}
                fullScreen={true}
                filter={false}
                legend={false}
            />
        );

        expect(view.container.firstChild).not.toHaveClass('h-full');
    });
});
