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

vi.mock('@/components/ui/legend', () => ({
    default: ({ legendData }: any) => <div data-testid="legend">{JSON.stringify(legendData)}</div>
}));

vi.mock('@/lib/visualizations/chart/helper', () => ({
    computeLegendColors: vi.fn(() => [{ key: 'k', color: '#1' }]),
    constructSeries: vi.fn(() => [{ type: 'bar' }])
}));

vi.mock('@/lib/visualizations/calendar/helper', () => ({
    computeCalendar: vi.fn(() => ({
        calendar: [{ range: '2020' }],
        series: [{ type: 'heatmap' }]
    })),
    computeColors: vi.fn(() => ['#1']),
    computeLegendColors: vi.fn(() => [{ label: 'legend', color: '#1' }]),
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
    computeLegendColors: vi.fn(() => [{ label: 'l', color: '#1' }]),
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
    computePropertiesForToolTip: vi.fn(() => 'tooltip')
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
        expect(screen.getByTestId('legend')).toBeInTheDocument();

        rerender(<CalendarGraphView categories={['A']} calendar={[{ date: '2020-01-01', value: 1 }] as any} {...common} />);
        rerender(<ForcedLayoutGraphView nodes={[{ id: 'a' }] as any} links={[{ source: 'a', target: 'a' }] as any} {...common} />);
        rerender(<FunnelView data={{ values: [] } as any} {...common} />);
        rerender(<PieView data={{ values: [] } as any} {...common} />);
        rerender(<SankeyGraphView nodes={[{ id: 'a' }] as any} links={[{ source: 'a', target: 'a' }] as any} {...common} />);
        rerender(<ScatterView points={[[1, 2]] as any} categories={['A']} {...common} />);
        rerender(<SunburstView nodes={[{ name: 'n' }] as any} categories={['A']} {...common} />);
        rerender(<TreeMapView nodes={[{ name: 'n' }] as any} categories={['A']} {...common} />);
        rerender(<WordCloudView words={[{ text: 'x', value: 1 }] as any} {...common} />);

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
        const { container } = render(
            <MatrixView
                nodes={[{ id: 'a' }, { id: 'b' }] as any}
                links={[{ source: 'a', target: 'b' }] as any}
                legend={false}
                options={{}}
                fullScreen={false}
            />
        );

        expect(container.textContent).toContain('cell');
    });
});
