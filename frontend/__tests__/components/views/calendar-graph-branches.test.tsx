import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const { computeCalendarSpy, computeColorsSpy, computePropertiesSpy, echartsPropsSpy } = vi.hoisted(() => ({
  computeCalendarSpy: vi.fn(),
  computeColorsSpy: vi.fn(),
  computePropertiesSpy: vi.fn(),
  echartsPropsSpy: vi.fn()
}));

vi.mock('@/components/providers/theme-provider', () => ({
  useThemeColors: () => ({
    calendar: {
      light: { colors: ['#aaa', '#bbb'] },
      dark: { colors: ['#111', '#222'] }
    }
  })
}));

vi.mock('@/lib/visualizations/calendar/helper', () => ({
  computeCalendar: (...args: any[]) => computeCalendarSpy(...args),
  computeColors: (...args: any[]) => computeColorsSpy(...args),
  computePropertiesForToolTip: (...args: any[]) => computePropertiesSpy(...args)
}));

vi.mock('@/components/views/generic/echarts', () => ({
  default: (props: any) => {
    echartsPropsSpy(props);
    return <div data-testid="echarts">echarts</div>;
  }
}));

import CalendarGraphView from '@/components/views/calendar-graph';

describe('CalendarGraphView branches', () => {
  beforeEach(() => {
    computeCalendarSpy.mockReset();
    computeColorsSpy.mockReset();
    computePropertiesSpy.mockReset();
    echartsPropsSpy.mockReset();

    computeColorsSpy.mockReturnValue(['#aaa']);
    computePropertiesSpy.mockImplementation((properties: any, value: number) => `prop:${JSON.stringify(properties)}:${value}`);
  });

  it('covers tooltip and fullscreen sizing for dark mode with legend', () => {
    localStorage.setItem('theme', 'dark');
    computeCalendarSpy.mockReturnValue({
      calendar: [],
      series: [{ type: 'heatmap' }]
    });

    const calendar = [
      { date: '2024-01-01', value: 1, properties: { foo: 'bar' }, category: 'work' },
      { date: '2024-01-02', value: 2, category: 'personal' }
    ] as any;

    render(
      <CalendarGraphView
        categories={['work', 'personal']}
        calendar={calendar}
        legend={true}
        options={{}}
        fullScreen={true}
      />
    );

    const props = echartsPropsSpy.mock.calls.at(-1)?.[0];
    expect(props.style).toEqual({ height: '560px' });
    expect(props.option.visualMap.textStyle.color).toBe('#888');
    expect(props.option.legend.show).toBe(true);
    expect(props.option.visualMap.top).toBeGreaterThan(props.option.legend.top);

    const formatter = props.option.tooltip.formatter as (params: any) => string;
    expect(formatter({ data: ['2024-01-01'] })).toContain('prop:{"foo":"bar"}:1');
    expect(formatter({ data: ['2024-01-02'] })).toContain('prop:null:2');
    expect(formatter({ data: ['2099-01-01'] })).toBe('');
    expect(formatter({ data: [] })).toBe('');
    expect(formatter({})).toBe('');
  });

  it('covers light mode and non-fullscreen default height', () => {
    localStorage.setItem('theme', 'light');
    computeCalendarSpy.mockReturnValue({
      calendar: Array.from({ length: 9 }, (_, idx) => ({ range: `202${idx}` })),
      series: [{ type: 'heatmap' }]
    });

    render(
      <CalendarGraphView
        categories={['work']}
        calendar={[{ date: '2024-01-01', value: 1, category: 'work' }] as any}
        legend={false}
        options={{}}
        fullScreen={false}
      />
    );

    const props = echartsPropsSpy.mock.calls.at(-1)?.[0];
    expect(props.style).toEqual({ height: '100%' });
    expect(props.option.visualMap.textStyle.color).toBe('#333');
    expect(props.option.legend.show).toBe(false);
    expect(props.option.legend.data).toEqual(['work']);
    expect(props.option.series.some((series: { name: string }) => series.name === 'work')).toBe(true);
  });
});
