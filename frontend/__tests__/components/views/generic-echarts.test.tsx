import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';

const resizeSpy = vi.fn();
const getInstance = vi.fn(() => ({ id: 'instance', resize: resizeSpy }));
const echartsLibPropsSpy = vi.fn();

vi.mock('echarts/core', () => ({
    default: {},
    use: vi.fn()
}));

vi.mock('echarts-wordcloud', () => ({}));
vi.mock('echarts/charts', () => ({
    SankeyChart: {}, GraphChart: {}, HeatmapChart: {}, LineChart: {}, BarChart: {}, ScatterChart: {}, PieChart: {}, TreemapChart: {}, SunburstChart: {}, FunnelChart: {}
}));
vi.mock('echarts/components', () => ({
    TooltipComponent: {}, GridComponent: {}, DatasetComponent: {}, TransformComponent: {}, LegendComponent: {}, VisualMapComponent: {}, CalendarComponent: {}, ToolboxComponent: {}
}));
vi.mock('echarts/renderers', () => ({ SVGRenderer: {} }));

vi.mock('echarts-for-react', () => ({
    default: React.forwardRef((props: any, ref) => {
        echartsLibPropsSpy(props);
        React.useImperativeHandle(ref, () => ({
            getEchartsInstance: getInstance
        }));
        return <div data-testid="echarts-lib">{JSON.stringify(props)}</div>;
    })
}));

import ReactEcharts from '@/components/views/generic/echarts';

describe('ReactEcharts wrapper', () => {
    beforeEach(() => {
        window.history.pushState({}, '', '/');
    });

    it('forwards props and exposes getEchartsInstance via ref', () => {
        const ref = createRef<any>();
        const onEvents = { legendselectchanged: vi.fn() };
        const { getByTestId } = render(
            <ReactEcharts
                ref={ref}
                option={{ series: [] }}
                className="chart"
                loading
                theme="dark"
                style={{ height: '100px' }}
                onEvents={onEvents}
            />
        );

        expect(getByTestId('echarts-lib')).toBeInTheDocument();
        expect(ref.current.getEchartsInstance()).toMatchObject({ id: 'instance' });
        expect(getInstance).toHaveBeenCalledTimes(1);
        expect(echartsLibPropsSpy.mock.calls.at(-1)?.[0].onEvents).toBe(onEvents);
    });

    it('adds shared roam support without dataZoom components', () => {
        const { rerender } = render(
            <ReactEcharts option={{ xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [1, 2] }] }} />
        );
        expect(echartsLibPropsSpy.mock.calls.at(-1)?.[0].option.dataZoom).toBeUndefined();
        expect(echartsLibPropsSpy.mock.calls.at(-1)?.[0].option.toolbox.feature.dataZoom).toBeUndefined();
        expect(echartsLibPropsSpy.mock.calls.at(-1)?.[0].option.toolbox.feature.restore).toEqual({});

        rerender(<ReactEcharts option={{ series: [{ type: 'graph', data: [] }] }} />);
        expect(echartsLibPropsSpy.mock.calls.at(-1)?.[0].option.series[0].roam).toBe(true);
    });

    it('wires resize listeners and observer callbacks', () => {
        const disconnect = vi.fn();
        let observerCb: (() => void) | undefined;
        vi.stubGlobal('ResizeObserver', class {
            constructor(cb: () => void) {
                observerCb = cb;
            }

            observe() {}

            disconnect() {
                disconnect();
            }
        });

        const { unmount } = render(
            <ReactEcharts
                option={{ series: [] }}
                className="chart"
                style={{ height: '100px' }}
            />
        );

        act(() => {
            window.dispatchEvent(new Event('resize'));
            observerCb?.();
        });

        expect(resizeSpy).toHaveBeenCalled();
        unmount();
        expect(disconnect).toHaveBeenCalled();
    });

    it('shows the export control in visualization hub and playground routes', () => {
        window.history.pushState({}, '', '/playground');
        const { rerender } = render(<ReactEcharts option={{ series: [] }} />);
        expect(screen.getByRole('button', { name: 'Export visualization' })).toBeInTheDocument();

        window.history.pushState({}, '', '/visualizationhub?name=Sales&type=bar-chart');
        rerender(<ReactEcharts option={{ series: [] }} />);
        expect(screen.getByRole('button', { name: 'Export visualization' })).toBeInTheDocument();
    });
});
