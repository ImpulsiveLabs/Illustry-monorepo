import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const { constructSeriesSpy, echartsPropsSpy } = vi.hoisted(() => ({
  constructSeriesSpy: vi.fn(() => [{ type: 'bar' }]),
  echartsPropsSpy: vi.fn()
}));

vi.mock('@/components/providers/theme-provider', () => ({
  useThemeColors: () => ({
    barChart: {
      light: { colors: ['#bar-light'] },
      dark: { colors: ['#bar-dark'] }
    },
    lineChart: {
      light: { colors: ['#line-light'] },
      dark: { colors: ['#line-dark'] }
    }
  })
}));

vi.mock('@/lib/visualizations/chart/helper', () => ({
  constructSeries: (...args: any[]) => constructSeriesSpy(...args)
}));

vi.mock('@/components/views/generic/echarts', () => ({
  default: (props: any) => {
    echartsPropsSpy(props);
    return <div data-testid="echarts">echarts</div>;
  }
}));

import AxisChartView from '@/components/views/axis-charts';

describe('AxisChartView branches', () => {
  beforeEach(() => {
    constructSeriesSpy.mockClear();
    echartsPropsSpy.mockClear();
  });

  it('uses dark palette for bar and line types', () => {
    localStorage.setItem('theme', 'dark');
    const data = { headers: ['A'], values: { series: [1] } } as any;

    const bar = render(<AxisChartView data={data} type="bar" legend={true} options={{}} fullScreen={true} />);
    expect(constructSeriesSpy.mock.calls.at(-1)?.[1]).toEqual(['#bar-dark']);
    expect(echartsPropsSpy.mock.calls.at(-1)?.[0].style).toEqual({ height: '73.5vh' });
    bar.unmount();

    render(<AxisChartView data={data} type="line" legend={true} options={{}} fullScreen={false} />);
    expect(constructSeriesSpy.mock.calls.at(-1)?.[1]).toEqual(['#line-dark']);
    expect(echartsPropsSpy.mock.calls.at(-1)?.[0].style).toEqual({ height: '100%' });
  });

  it('uses light palette and boundary gap toggles by chart type', () => {
    localStorage.setItem('theme', 'light');
    const data = { headers: ['A'], values: { series: [1] } } as any;

    const bar = render(<AxisChartView data={data} type="bar" legend={false} options={{}} fullScreen={false} />);
    const barOption = echartsPropsSpy.mock.calls.at(-1)?.[0].option;
    expect(constructSeriesSpy.mock.calls.at(-1)?.[1]).toEqual(['#bar-light']);
    expect(barOption.xAxis[0].boundaryGap).toBe(true);
    expect(barOption.legend.show).toBe(false);
    bar.unmount();

    render(<AxisChartView data={data} type="line" legend={false} options={{}} fullScreen={false} />);
    const lineOption = echartsPropsSpy.mock.calls.at(-1)?.[0].option;
    expect(constructSeriesSpy.mock.calls.at(-1)?.[1]).toEqual(['#line-light']);
    expect(lineOption.xAxis[0].boundaryGap).toBe(false);
    expect(lineOption.legend.show).toBe(false);
  });
});
