import React, { forwardRef, useImperativeHandle } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { echartsOnSpy, echartsSetOptionSpy, echartsPropsSpy } = vi.hoisted(() => ({
    echartsOnSpy: vi.fn(),
    echartsSetOptionSpy: vi.fn(),
    echartsPropsSpy: vi.fn()
}));

vi.mock('@/components/providers/theme-provider', () => ({
    useThemeColors: () => ({
        barChart: { light: { colors: ['#1'] }, dark: { colors: ['#2'] } },
        lineChart: { light: { colors: ['#3'] }, dark: { colors: ['#4'] } },
        calendar: { light: { colors: ['#5'] }, dark: { colors: ['#6'] } },
        flg: { light: { colors: ['#7', '#8', '#9'] }, dark: { colors: ['#a', '#b', '#c'] } },
        funnel: { light: { colors: ['#d'] }, dark: { colors: ['#e'] } },
        pieChart: { light: { colors: ['#f'] }, dark: { colors: ['#10'] } },
        sankey: { light: { colors: ['#11'] }, dark: { colors: ['#12'] } },
        scatter: { light: { colors: ['#13'] }, dark: { colors: ['#14'] } },
        sunburst: { light: { colors: ['#15'] }, dark: { colors: ['#16'] } },
        treeMap: { light: { colors: ['#17'] }, dark: { colors: ['#18'] } },
        heb: { light: { colors: ['#19'] }, dark: { colors: ['#20'] } },
        wordcloud: { light: { colors: ['#21'] }, dark: { colors: ['#22'] } }
    })
}));

vi.mock('@/components/views/generic/echarts', () => ({
    default: forwardRef((props: any, ref) => {
        echartsPropsSpy(props);
        useImperativeHandle(ref, () => ({
            getEchartsInstance: () => ({
                on: echartsOnSpy,
                setOption: echartsSetOptionSpy
            })
        }));
        return <div data-testid="echarts">{JSON.stringify(props.style || {})}</div>;
    })
}));

vi.mock('@/lib/visualizations/chart/helper', () => ({
    constructSeries: vi.fn(() => [{ type: 'bar' }])
}));

vi.mock('@/lib/visualizations/calendar/helper', () => ({
    computeCalendar: vi.fn(() => ({
        calendar: [{ range: '2020' }],
        series: [{ type: 'heatmap' }]
    })),
    computeColors: vi.fn(() => ['#1']),
    computePropertiesForToolTip: vi.fn(() => 'tooltip')
}));

vi.mock('@/lib/visualizations/node-link/helper', () => ({
    computeCategoriesFLGOrHEB: vi.fn(() => [{ name: 'cat', itemStyle: { color: '#1' } }]),
    computeLinksFLGOrHEB: vi.fn(() => [{ source: 'a', target: 'b' }]),
    computeNodesFLG: vi.fn(() => [{ id: 'a' }]),
    computeNodesHEB: vi.fn(() => [{ id: 'a' }]),
    computeCategoriesSankey: vi.fn(() => ['cat']),
    computeNodesSankey: vi.fn(() => [{ name: 'a' }]),
    categoryMap: vi.fn(() => ({ A: [{ id: 'a' }], B: [{ id: 'b' }] })),
    createHeadersAndPropertiesString: vi.fn(() => '<tbody><tr><td>cell</td></tr></tbody>'),
    sortRows: vi.fn(),
    sortColumns: vi.fn(),
    addStyleTooltipWithHover: vi.fn()
}));

vi.mock('@/lib/visualizations/pieFunnel/helper', () => ({
    computeValues: vi.fn(() => [{ value: 1, name: 'A' }])
}));

vi.mock('@/lib/visualizations/scatter/helper', () => ({
    computeColors: vi.fn(() => ['#1'])
}));

vi.mock('@/lib/visualizations/hierarchy-charts/helper', () => ({
    computeNodesHierarchy: vi.fn(() => [{ name: 'root' }]),
    calculateMeanValue: vi.fn(() => 1),
    computeMaxDepth: vi.fn(() => 2),
    computeUniqueValues: vi.fn(() => [1, 2]),
    createLevels: vi.fn(() => [{ level: 1 }])
}));

vi.mock('@/lib/visualizations/word-cloud/helper', () => ({
    computeWords: vi.fn(() => [{ name: 'word', value: 2 }]),
    computePropertiesForToolTip: vi.fn(() => 'tooltip'),
    calculateMeanValue: vi.fn(() => 1)
}));

import AxisChartView from '@/components/views/axis-charts';
import CalendarGraphView from '@/components/views/calendar-graph';
import ForcedLayoutGraphView from '@/components/views/forced-layout-graph';
import FunnelView from '@/components/views/funnel-chart';
import HierarchicalEdgeBundlingGraphView from '@/components/views/hierarchical-edge-bundling';
import MatrixView from '@/components/views/matrix';
import PieView from '@/components/views/pie-chart';
import SankeyGraphView from '@/components/views/sankey-diagram';
import ScatterView from '@/components/views/scatter';
import SunburstView from '@/components/views/sunburst-chart';
import TreeMapView from '@/components/views/treemap-chart';
import WordCloudView from '@/components/views/wordcloud';
import * as nodeLinkHelper from '@/lib/visualizations/node-link/helper';

describe('Core Views', () => {
    beforeEach(() => {
        localStorage.setItem('theme', 'light');
        echartsOnSpy.mockClear();
        echartsSetOptionSpy.mockClear();
        echartsPropsSpy.mockClear();
    });

    it('renders all chart views with echarts and optional legends', async () => {
        const common = { legend: true, options: {}, fullScreen: false } as any;
        const { rerender } = render(<AxisChartView data={{ headers: ['x'], values: [[1]] } as any} type="bar" {...common} />);
        let latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.legend.show).toBe(true);
        expect(latest.option.legend.type).toBe('scroll');

        rerender(<CalendarGraphView categories={['A']} calendar={[{ date: '2020-01-01', value: 1 }] as any} {...common} />);
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.calendar[0].top).toBeGreaterThan(latest.option.legend.top);
        rerender(<ForcedLayoutGraphView nodes={[{ id: 'a' }] as any} links={[{ source: 'a', target: 'a' }] as any} {...common} />);
        rerender(<FunnelView data={{ values: [] } as any} {...common} />);
        rerender(<PieView data={{ values: [] } as any} {...common} />);
        rerender(<SankeyGraphView nodes={[{ id: 'a' }] as any} links={[{ source: 'a', target: 'a' }] as any} {...common} />);
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.legend.data.length).toBeGreaterThan(0);
        expect(latest.option.series.some((series: { id?: string }) => series.id === 'legend-proxy')).toBe(true);
        rerender(<ScatterView points={[[1, 2]] as any} categories={['A']} {...common} />);
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.legend.data.length).toBeGreaterThan(0);
        expect(latest.option.series[0].name).toBe('A');
        rerender(<SunburstView nodes={[{ name: 'n' }] as any} categories={['A']} {...common} />);
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.legend.data.length).toBeGreaterThan(0);
        rerender(<TreeMapView nodes={[{ name: 'n' }] as any} categories={['A']} {...common} />);
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.legend.data.length).toBeGreaterThan(0);
        rerender(<WordCloudView words={[{ text: 'x', value: 1 }] as any} {...common} />);
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.legend.data.length).toBeGreaterThan(0);

        expect(screen.getByTestId('echarts')).toBeInTheDocument();
        expect(echartsPropsSpy).toHaveBeenCalled();
    });

    it('registers hover handlers in hierarchical-edge-bundling view', async () => {
        render(
            <HierarchicalEdgeBundlingGraphView
                nodes={[{ id: 'a' }] as any}
                links={[{ source: 'a', target: 'a' }] as any}
                legend={false}
                options={{}}
                fullScreen={false}
            />
        );

        await waitFor(() => {
            expect(echartsOnSpy).toHaveBeenCalled();
        });
    });

    it('builds matrix table and renders content', () => {
        localStorage.setItem('theme', 'dark');
        const { container, unmount } = render(
            <MatrixView
                nodes={[{ id: 'a' }, { id: 'b' }] as any}
                links={[{ source: 'a', target: 'b' }] as any}
                legend={false}
                options={{}}
                fullScreen={false}
            />
        );

        expect(container.textContent).toContain('cell');
        const tooltip = document.createElement('div');
        tooltip.id = 'showData';
        document.body.appendChild(tooltip);
        unmount();
        expect(document.getElementById('showData')).not.toBeInTheDocument();
    });

    it('renders matrix fallback table for non-bipartite category maps', () => {
        vi.mocked(nodeLinkHelper.categoryMap).mockReturnValueOnce({ same: [{ id: 'a' }, { id: 'b' }] } as any);
        const { container } = render(
            <MatrixView
                nodes={[{ id: 'a', category: 'same' }, { id: 'b', category: 'same' }] as any}
                links={[{ source: 'a', target: 'b' }] as any}
                legend={false}
                options={{}}
                fullScreen={false}
            />
        );

        expect(container.querySelector('#myTable')).toBeInTheDocument();
    });

    it('executes tooltip formatter callbacks across view variants', () => {
        localStorage.setItem('theme', 'dark');

        const shared = { legend: false, options: {}, fullScreen: true } as any;
        const { rerender } = render(
            <ForcedLayoutGraphView
                nodes={[{ id: 'a' }] as any}
                links={[{ source: 'a', target: 'a', value: 1 }] as any}
                {...shared}
            />
        );
        let latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.tooltip.formatter({ data: { prop: 'forced' } })).toBe('forced');

        rerender(
            <SankeyGraphView
                nodes={[{ id: 'a' }] as any}
                links={[{ source: 'a', target: 'a', value: 1 }] as any}
                {...shared}
            />
        );
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.tooltip.formatter({ data: { prop: 'sankey' } })).toBe('sankey');

        rerender(
            <SunburstView
                nodes={[{ name: 'root' }] as any}
                categories={['A']}
                {...shared}
            />
        );
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.tooltip.formatter({ data: { prop: 'sun' } })).toBe('sun');

        rerender(
            <TreeMapView
                nodes={[{ name: 'root', value: 1 }] as any}
                categories={['A']}
                {...shared}
            />
        );
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.tooltip.formatter({ data: { prop: 'tree' } })).toBe('tree');

        rerender(<WordCloudView words={[{ text: 'x', value: 1 }] as any} {...shared} />);
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(latest.option.tooltip.formatter({ data: { properties: { a: 1 }, value: 1 } })).toBe('tooltip');
        expect(latest.style).toEqual({ height: '73.5vh' });
    });

    it('handles native legend selection events for sunburst, treemap and wordcloud', () => {
        localStorage.setItem('theme', 'light');

        const common = { legend: true, options: {}, fullScreen: false } as any;
        const { rerender } = render(
            <SunburstView
                nodes={[{ name: 'Group A', value: 1, category: 'A' }, { name: 'Group B', value: 2, category: 'B' }] as any}
                categories={['A', 'B']}
                {...common}
            />
        );

        let latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(typeof latest.onEvents.legendselectchanged).toBe('function');
        latest.onEvents.legendselectchanged({ selected: { 'Group A': true, 'Group B': false } });

        rerender(
            <TreeMapView
                nodes={[{ name: 'Group A', value: 1, category: 'A' }, { name: 'Group B', value: 2, category: 'B' }] as any}
                categories={['A', 'B']}
                {...common}
            />
        );
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(typeof latest.onEvents.legendselectchanged).toBe('function');
        latest.onEvents.legendselectchanged({ selected: { 'Group A': false, 'Group B': true } });

        rerender(
            <WordCloudView
                words={[
                    { name: 'Alpha', value: 10 },
                    { name: 'Beta', value: 8 }
                ] as any}
                {...common}
            />
        );
        latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
        expect(typeof latest.onEvents.legendselectchanged).toBe('function');
        latest.onEvents.legendselectchanged({ selected: { '>100% avg': true, '75-100% avg': false } });
        expect(latest.option.legend.data).toEqual([
            '0-25% avg',
            '25-50% avg',
            '50-75% avg',
            '75-100% avg',
            '>100% avg'
        ]);
    });
});
