import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const {
  echartsPropsSpy,
  pieComputeValuesSpy,
  funnelComputeValuesSpy,
  scatterColorsSpy,
  scatterLegendSpy
} = vi.hoisted(() => ({
  echartsPropsSpy: vi.fn(),
  pieComputeValuesSpy: vi.fn(() => [{ value: 1, name: 'A' }]),
  funnelComputeValuesSpy: vi.fn(() => [{ value: 1, name: 'A' }]),
  scatterColorsSpy: vi.fn(() => ['#1']),
  scatterLegendSpy: vi.fn(() => ({ A: '#1' }))
}));

vi.mock('@/components/providers/theme-provider', () => ({
  useThemeColors: () => ({
    pieChart: {
      light: { colors: ['#pie-light'] },
      dark: { colors: ['#pie-dark'] }
    },
    funnel: {
      light: { colors: ['#funnel-light'] },
      dark: { colors: ['#funnel-dark'] }
    },
    scatter: {
      light: { colors: ['#scatter-light'] },
      dark: { colors: ['#scatter-dark'] }
    }
  })
}));

vi.mock('@/lib/visualizations/pieFunnel/helper', () => ({
  computeValues: (data: any, colors: string[]) => {
    if (Array.isArray(colors) && colors[0] === '#pie-dark') return pieComputeValuesSpy(data, colors);
    if (Array.isArray(colors) && colors[0] === '#funnel-dark') return funnelComputeValuesSpy(data, colors);
    if (Array.isArray(colors) && colors[0] === '#pie-light') return pieComputeValuesSpy(data, colors);
    return funnelComputeValuesSpy(data, colors);
  }
}));

vi.mock('@/lib/visualizations/scatter/helper', () => ({
  computeColors: (...args: any[]) => scatterColorsSpy(...args)
}));

vi.mock('@/lib/visualizations/calendar/helper', () => ({
  computeLegendColors: (...args: any[]) => scatterLegendSpy(...args)
}));

vi.mock('@/components/views/generic/echarts', () => ({
  default: (props: any) => {
    echartsPropsSpy(props);
    return <div data-testid="echarts">echarts</div>;
  }
}));

import PieView from '@/components/views/pie-chart';
import FunnelView from '@/components/views/funnel-chart';
import ScatterView from '@/components/views/scatter';

describe('Pie/Funnel/Scatter view branches', () => {
  beforeEach(() => {
    echartsPropsSpy.mockClear();
    pieComputeValuesSpy.mockClear();
    funnelComputeValuesSpy.mockClear();
    scatterColorsSpy.mockClear();
    scatterLegendSpy.mockClear();
  });

  it('covers dark and light branches for pie', () => {
    localStorage.setItem('theme', 'dark');
    const dark = render(<PieView data={{ values: { A: 1 } } as any} legend={false} options={{}} fullScreen={true} />);
    let latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
    expect(pieComputeValuesSpy.mock.calls.at(-1)?.[1]).toEqual(['#pie-dark']);
    expect(latest.style).toEqual({ height: '73.5vh' });
    expect(latest.option.legend.show).toBe(false);
    dark.unmount();

    localStorage.setItem('theme', 'light');
    render(<PieView data={{ values: { A: 1 } } as any} legend={true} options={{}} fullScreen={false} />);
    latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
    expect(pieComputeValuesSpy.mock.calls.at(-1)?.[1]).toEqual(['#pie-light']);
    expect(latest.option.legend.show).toBe(true);
    expect(latest.style).toEqual({ height: '100%' });
  });

  it('covers dark and light branches for funnel', () => {
    localStorage.setItem('theme', 'dark');
    const dark = render(<FunnelView data={{ values: { A: 1 } } as any} legend={false} options={{}} fullScreen={true} />);
    let latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
    expect(funnelComputeValuesSpy.mock.calls.at(-1)?.[1]).toEqual(['#funnel-dark']);
    expect(latest.style).toEqual({ height: '73.5vh' });
    expect(latest.option.legend.show).toBe(false);
    dark.unmount();

    localStorage.setItem('theme', 'light');
    render(<FunnelView data={{ values: { A: 1 } } as any} legend={true} options={{}} fullScreen={false} />);
    latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
    expect(funnelComputeValuesSpy.mock.calls.at(-1)?.[1]).toEqual(['#funnel-light']);
    expect(latest.option.legend.show).toBe(true);
    expect(latest.style).toEqual({ height: '100%' });
  });

  it('covers dark/light text color and legend branches for scatter', () => {
    localStorage.setItem('theme', 'dark');
    const dark = render(
      <ScatterView
        points={[[1, 2, 'A']] as any}
        categories={['A']}
        legend={false}
        options={{}}
        fullScreen={true}
      />
    );

    let latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
    expect(latest.option.visualMap.textStyle.color).toBe('#888');
    expect(latest.option.series[0].name).toBe('A');
    expect(latest.style).toEqual({ height: '73.5vh' });
    dark.unmount();

    localStorage.setItem('theme', 'light');
    render(
      <ScatterView
        points={[[1, 2, 'A']] as any}
        categories={['A']}
        legend={true}
        options={{}}
        fullScreen={false}
      />
    );

    latest = echartsPropsSpy.mock.calls.at(-1)?.[0];
    expect(latest.option.visualMap.textStyle.color).toBe('#333');
    expect(latest.style).toEqual({ height: '100%' });
    expect(latest.option.legend.show).toBe(true);
    expect(latest.option.legend.data).toEqual(['A']);
    expect(latest.option.series[0].name).toBe('A');
  });
});
