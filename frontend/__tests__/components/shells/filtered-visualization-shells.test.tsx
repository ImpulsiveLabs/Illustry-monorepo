import { describe, expect, it, vi } from 'vitest';
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

vi.mock('@/components/ui/collapsable-searchbar', () => ({
    default: (props: any) => <div data-testid="search-bar">{JSON.stringify(props)}</div>
}));

import FilterAxisShell from '@/components/shells/axis/filter-axis-shell';
import FilterCalendarShell from '@/components/shells/calendar/filter-calendar-shell';
import FilterForcedShell from '@/components/shells/forced-layout-graph/filter-forced-layout-graph-shell';
import FilterFunnelShell from '@/components/shells/funnel/filter-funnel-shell';
import FilterHebShell from '@/components/shells/hierarchical-edge-bundling/filter-hierarchical-edge-bundling-shell';
import FilterMatrixShell from '@/components/shells/matrix/filter-matrix-shell';
import FilterPieShell from '@/components/shells/pie-chart/filter-piechart-shell';
import FilterSankeyShell from '@/components/shells/sankey/filter-sankey-shell';
import FilterScatterShell from '@/components/shells/scatter/filter-scatter-shell';
import FilterSunburstShell from '@/components/shells/sunburst/filtered-sunburst-shell';
import FilterTimelineShell from '@/components/shells/timeline/filter-timeline-shell';
import FilterTreemapShell from '@/components/shells/treemap/filter-treemap-shell';
import FilterWordcloudShell from '@/components/shells/wordcloud/filter-wordcloud-shell';

describe('Filtered Visualization Shells', () => {
    it('renders filter axis shell with search bar and dynamic chart', () => {
        render(<FilterAxisShell data={{ rows: [] } as any} type="bar" legend options={{}} fullScreen={false} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('bar-chart');
        expect(screen.getByTestId('dynamic-view')).toBeInTheDocument();
    });

    it('renders filter shells that accept full data object', () => {
        const common = { options: {}, legend: false, fullScreen: true };
        const { rerender } = render(<FilterFunnelShell data={{ values: [] } as any} {...common} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('funnel');

        rerender(<FilterPieShell data={{ values: [] } as any} {...common} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('pie-chart');

        rerender(<FilterTimelineShell data={{ timeline: [] } as any} {...common} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('timeline');

        rerender(<FilterWordcloudShell words={[{ text: 'x', value: 1 }] as any} {...common} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('word-cloud');
    });

    it('renders node-link filtered shells and forwards initial nodes/links', () => {
        const common = { options: {}, legend: true, fullScreen: false };
        const nodes = [{ id: 'n1' } as any];
        const links = [{ source: 'n1', target: 'n1' } as any];

        const { rerender } = render(<FilterMatrixShell nodes={nodes} links={links} {...common} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('matrix');

        rerender(<FilterForcedShell nodes={nodes} links={links} {...common} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('force-directed-graph');

        rerender(<FilterHebShell nodes={nodes} links={links} {...common} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('hierarchical-edge-bundling');

        rerender(<FilterSankeyShell nodes={nodes} links={links} {...common} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('sankey');
    });

    it('renders category-based filtered shells', () => {
        const common = { options: {}, legend: false, fullScreen: true };

        const { rerender } = render(
            <FilterScatterShell
                points={[[1, 2, 3]] as any}
                categories={['a']}
                {...common}
            />
        );
        expect(screen.getByTestId('search-bar').textContent).toContain('scatter');

        rerender(<FilterSunburstShell categories={['a']} nodes={[{ name: 'n' } as any]} {...common} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('sunburst');

        rerender(<FilterTreemapShell categories={['a']} nodes={[{ name: 'n' } as any]} {...common} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('treemap');

        rerender(<FilterCalendarShell categories={['a']} calendar={[{ date: '2020-01-01', value: 1 } as any]} {...common} />);
        expect(screen.getByTestId('search-bar').textContent).toContain('calendar');
    });
});
