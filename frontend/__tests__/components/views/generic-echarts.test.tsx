import React, { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const getInstance = vi.fn(() => ({ id: 'instance' }));

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
        React.useImperativeHandle(ref, () => ({
            getEchartsInstance: getInstance
        }));
        return <div data-testid="echarts-lib">{JSON.stringify(props)}</div>;
    })
}));

import ReactEcharts from '@/components/views/generic/echarts';

describe('ReactEcharts wrapper', () => {
    it('forwards props and exposes getEchartsInstance via ref', () => {
        const ref = createRef<any>();
        const { getByTestId } = render(
            <ReactEcharts
                ref={ref}
                option={{ series: [] }}
                className="chart"
                loading
                theme="dark"
                style={{ height: '100px' }}
            />
        );

        expect(getByTestId('echarts-lib')).toBeInTheDocument();
        expect(ref.current.getEchartsInstance()).toEqual({ id: 'instance' });
        expect(getInstance).toHaveBeenCalledTimes(1);
    });
});
