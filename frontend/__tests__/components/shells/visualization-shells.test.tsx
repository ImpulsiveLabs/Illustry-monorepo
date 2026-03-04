import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const { dynamicViewSpy } = vi.hoisted(() => ({
    dynamicViewSpy: vi.fn()
}));

vi.mock('next/dynamic', () => ({
    default: () => {
        const DynamicMock = (props: any) => {
            dynamicViewSpy(props);
            return <div data-testid="dynamic-view">{JSON.stringify(props)}</div>;
        };
        return DynamicMock;
    }
}));

vi.mock('@/components/shells/funnel/filter-funnel-shell', () => ({
    default: (props: any) => <div data-testid="filtered-funnel">{JSON.stringify(props)}</div>
}));
vi.mock('@/components/shells/pie-chart/filter-piechart-shell', () => ({
    default: (props: any) => <div data-testid="filtered-pie">{JSON.stringify(props)}</div>
}));
vi.mock('@/components/shells/timeline/filter-timeline-shell', () => ({
    default: (props: any) => <div data-testid="filtered-timeline">{JSON.stringify(props)}</div>
}));
vi.mock('@/components/shells/wordcloud/filter-wordcloud-shell', () => ({
    default: (props: any) => <div data-testid="filtered-wordcloud">{JSON.stringify(props)}</div>
}));
vi.mock('@/components/shells/matrix/filter-matrix-shell', () => ({
    default: (props: any) => <div data-testid="filtered-matrix">{JSON.stringify(props)}</div>
}));
vi.mock('@/components/shells/forced-layout-graph/filter-forced-layout-graph-shell', () => ({
    default: (props: any) => <div data-testid="filtered-forced">{JSON.stringify(props)}</div>
}));
vi.mock('@/components/shells/hierarchical-edge-bundling/filter-hierarchical-edge-bundling-shell', () => ({
    default: (props: any) => <div data-testid="filtered-heb">{JSON.stringify(props)}</div>
}));
vi.mock('@/components/shells/sankey/filter-sankey-shell', () => ({
    default: (props: any) => <div data-testid="filtered-sankey">{JSON.stringify(props)}</div>
}));
vi.mock('@/components/shells/scatter/filter-scatter-shell', () => ({
    default: (props: any) => <div data-testid="filtered-scatter">{JSON.stringify(props)}</div>
}));
vi.mock('@/components/shells/sunburst/filtered-sunburst-shell', () => ({
    default: (props: any) => <div data-testid="filtered-sunburst">{JSON.stringify(props)}</div>
}));
vi.mock('@/components/shells/treemap/filter-treemap-shell', () => ({
    default: (props: any) => <div data-testid="filtered-treemap">{JSON.stringify(props)}</div>
}));
vi.mock('@/components/shells/calendar/filter-calendar-shell', () => ({
    default: (props: any) => <div data-testid="filtered-calendar">{JSON.stringify(props)}</div>
}));

vi.mock('@/lib/visualizations/hierarchy-charts/helper', () => ({
    computeCategories: vi.fn(() => ['computed-cat'])
}));
vi.mock('@/lib/visualizations/scatter/helper', () => ({
    computePoints: vi.fn(() => [['p1', 1, 2]]),
    computeCategoriesScatter: vi.fn(() => ['scatter-cat'])
}));
vi.mock('@/lib/visualizations/node-link/helper', () => ({
    computeLinksSankey: vi.fn((links: any[]) => links.map((l) => ({ ...l, computed: true })))
}));
vi.mock('@/lib/visualizations/calendar/helper', () => ({
    computeCategoriesCalendar: vi.fn(() => ['calendar-cat'])
}));

import AxisShell from '@/components/shells/axis/axis-shell';
import CalendarShell from '@/components/shells/calendar/calendar-shell';
import ForcedShell from '@/components/shells/forced-layout-graph/forced-layout-graph-shell';
import FunnelShell from '@/components/shells/funnel/funnel-shell';
import HebShell from '@/components/shells/hierarchical-edge-bundling/hierarchical-edge-bundling-shell';
import MatrixShell from '@/components/shells/matrix/matrix-shell';
import PieShell from '@/components/shells/pie-chart/piechart-shell';
import SankeyShell from '@/components/shells/sankey/sankey-shell';
import ScatterShell from '@/components/shells/scatter/scatter-shell';
import SunburstShell from '@/components/shells/sunburst/sunburst-shell';
import TimelineShell from '@/components/shells/timeline/timeline-shell';
import TreemapShell from '@/components/shells/treemap/treemap-shell';
import WordcloudShell from '@/components/shells/wordcloud/wordcloud-shell';

describe('Visualization Shell Wrappers', () => {
    beforeEach(() => {
        dynamicViewSpy.mockClear();
    });

    it('covers axis shell true/false filter branches', () => {
        const data = { rows: [] } as any;
        const { rerender } = render(<AxisShell data={data} type="bar" filter={false} legend={false} options={{}} fullScreen={false} />);
        expect(screen.getByTestId('dynamic-view')).toBeInTheDocument();
        rerender(<AxisShell data={data} type="line" filter={true} legend={true} options={{ a: 1 }} fullScreen={true} />);
        expect(screen.getByTestId('dynamic-view')).toBeInTheDocument();
    });

    it('covers simple filter shell routing for funnel pie timeline and wordcloud', () => {
        const common = { options: { x: 1 }, legend: true, fullScreen: true };

        const { rerender } = render(<FunnelShell data={{ values: [] } as any} filter={true} {...common} />);
        expect(screen.getByTestId('filtered-funnel')).toBeInTheDocument();
        rerender(<FunnelShell data={{ values: [] } as any} filter={false} {...common} />);
        expect(screen.getByTestId('dynamic-view')).toBeInTheDocument();

        rerender(<PieShell data={{ values: [] } as any} filter={true} {...common} />);
        expect(screen.getByTestId('filtered-pie')).toBeInTheDocument();
        rerender(<TimelineShell data={{ timeline: [] } as any} filter={true} {...common} />);
        expect(screen.getByTestId('filtered-timeline')).toBeInTheDocument();
        rerender(<WordcloudShell data={{ words: [{ text: 'a', value: 1 }] } as any} filter={true} {...common} />);
        expect(screen.getByTestId('filtered-wordcloud')).toBeInTheDocument();
    });

    it('passes node-link data to matrix forced heb and sankey filtered views', () => {
        const data = {
            nodes: [{ id: 'n1' }],
            links: [{ source: 'n1', target: 'n1' }]
        } as any;

        const common = { options: {}, legend: false, fullScreen: false, filter: true };
        const { rerender } = render(<MatrixShell data={data} {...common} />);
        expect(screen.getByTestId('filtered-matrix')).toBeInTheDocument();

        rerender(<ForcedShell data={data} {...common} />);
        expect(screen.getByTestId('filtered-forced')).toBeInTheDocument();

        rerender(<HebShell data={data} {...common} />);
        expect(screen.getByTestId('filtered-heb')).toBeInTheDocument();

        rerender(<SankeyShell data={data} {...common} />);
        expect(screen.getByTestId('filtered-sankey')).toBeInTheDocument();
        expect(screen.getByTestId('filtered-sankey').textContent).toContain('computed');
    });

    it('computes and forwards categories for scatter, treemap, sunburst, calendar', () => {
        const common = { options: {}, legend: true, fullScreen: true, filter: true };

        const { rerender } = render(<ScatterShell data={{ points: [{ x: 1, y: 2 }] } as any} {...common} />);
        expect(screen.getByTestId('filtered-scatter').textContent).toContain('scatter-cat');

        rerender(<TreemapShell data={{ nodes: [{ name: 'n' }] } as any} {...common} />);
        expect(screen.getByTestId('filtered-treemap').textContent).toContain('computed-cat');

        rerender(<SunburstShell data={{ nodes: [{ name: 'n' }] } as any} {...common} />);
        expect(screen.getByTestId('filtered-sunburst').textContent).toContain('computed-cat');

        rerender(<CalendarShell data={{ calendar: [{ date: '2020-01-01', value: 1 }] } as any} {...common} />);
        expect(screen.getByTestId('filtered-calendar').textContent).toContain('calendar-cat');
    });

    it('covers non-filter branches for all visualization wrappers', () => {
        const common = { options: { z: 9 }, legend: false, fullScreen: false, filter: false };
        const nodeLinkData = {
            nodes: [{ id: 'n1' }],
            links: [{ source: 'n1', target: 'n1' }]
        } as any;

        const { rerender } = render(<CalendarShell data={{ calendar: [{ date: '2020-01-01', value: 1 }] } as any} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('calendar-cat');

        rerender(<ForcedShell data={nodeLinkData} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('nodes');

        rerender(<HebShell data={nodeLinkData} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('links');

        rerender(<MatrixShell data={nodeLinkData} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('n1');

        rerender(<SankeyShell data={nodeLinkData} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('computed');

        rerender(<ScatterShell data={{ points: [{ x: 1, y: 2 }] } as any} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('scatter-cat');

        rerender(<SunburstShell data={{ nodes: [{ name: 'n' }] } as any} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('computed-cat');

        rerender(<TreemapShell data={{ nodes: [{ name: 'n' }] } as any} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('computed-cat');

        rerender(<TimelineShell data={{ timeline: [] } as any} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('timeline');

        rerender(<PieShell data={{ values: [] } as any} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('values');

        rerender(<FunnelShell data={{ values: [] } as any} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('values');

        rerender(<WordcloudShell data={{ words: [{ text: 'a', value: 1 }] } as any} {...common} />);
        expect(screen.getByTestId('dynamic-view').textContent).toContain('words');
    });
});
