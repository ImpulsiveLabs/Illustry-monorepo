import { describe, it, expect } from 'vitest';
import {
  buildLegendOption,
  buildLegendProxySeries,
  buildLegendSelectedMap,
  getChartTopPadding,
  getLegendItems
} from '@/lib/visualizations/legend/helper';

describe('legend helper', () => {
  it('builds normalized scroll legend options', () => {
    const option = buildLegendOption(true, [' Alpha ', '', 'Alpha', 'Beta']);

    expect(option.show).toBe(true);
    expect(option.type).toBe('scroll');
    expect(option.orient).toBe('horizontal');
    expect(option.icon).toBe('roundRect');
    expect(option.data).toEqual(['Alpha', 'Series 2', 'Beta']);
    expect(option.textStyle.overflow).toBe('truncate');
  });

  it('normalizes legend items and builds deterministic selected map', () => {
    const items = getLegendItems(['', ' Work ', 'Work', 'Personal']);
    const selected = buildLegendSelectedMap(items);

    expect(items).toEqual(['Series 1', 'Work', 'Personal']);
    expect(selected).toEqual({
      'Series 1': true,
      Work: true,
      Personal: true
    });
  });

  it('truncates long names through formatter and adapts style', () => {
    const long = 'This is a very long legend label name';
    const option = buildLegendOption(true, [long]);

    expect(option.formatter(long)).toBe('This is a very long l...');
    expect(option.textStyle.width).toBe(88);
    expect(option.textStyle.fontSize).toBe(9);
  });

  it('computes chart top padding with and without legend/title', () => {
    expect(getChartTopPadding(true, false)).toBe(68);
    expect(getChartTopPadding(false, false)).toBe(10);
    expect(getChartTopPadding(true, true)).toBe(108);
  });

  it('builds legend proxy series with mapped colors', () => {
    const proxy = buildLegendProxySeries(['A', 'B'], { A: '#111', B: '#222' });

    expect(proxy.id).toBe('legend-proxy');
    expect(proxy.data).toEqual([
      { name: 'A', value: 1, itemStyle: { color: '#111' } },
      { name: 'B', value: 1, itemStyle: { color: '#222' } }
    ]);
  });
});
