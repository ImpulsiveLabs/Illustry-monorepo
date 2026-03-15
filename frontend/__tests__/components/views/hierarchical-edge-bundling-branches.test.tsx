import React, { forwardRef, useImperativeHandle } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const { onSpy, setOptionSpy, echartsPropsSpy } = vi.hoisted(() => ({
  onSpy: vi.fn(),
  setOptionSpy: vi.fn(),
  echartsPropsSpy: vi.fn()
}));

vi.mock('@/components/providers/theme-provider', () => ({
  useThemeColors: () => ({
    flg: {
      light: { colors: ['#111', '#222', '#f00', '#0f0'] },
      dark: { colors: ['#333', '#444', '#00f', '#ff0'] }
    }
  })
}));

vi.mock('@/lib/visualizations/node-link/helper', () => ({
  computeCategoriesFLGOrHEB: vi.fn(() => [
    { name: 'cat1', itemStyle: { color: '#111' } },
    { name: 'cat2', itemStyle: { color: '#222' } }
  ]),
  computeNodesHEB: vi.fn(() => [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }])
}));

vi.mock('@/components/views/generic/echarts', () => ({
  default: forwardRef((props: any, ref) => {
    echartsPropsSpy(props);
    useImperativeHandle(ref, () => ({
      getEchartsInstance: () => ({
        on: onSpy,
        setOption: setOptionSpy
      })
    }));
    return <div data-testid="echarts">echarts</div>;
  })
}));

import HierarchicalEdgeBundlingGraphView from '@/components/views/hierarchical-edge-bundling';

describe('HierarchicalEdgeBundlingGraphView branches', () => {
  beforeEach(() => {
    localStorage.setItem('theme', 'light');
    onSpy.mockClear();
    setOptionSpy.mockClear();
    echartsPropsSpy.mockClear();
  });

  it('formats tooltip branches and handles mouse interactions for node/edge', () => {
    render(
      <HierarchicalEdgeBundlingGraphView
        nodes={[
          { name: 'A', category: 'cat1' },
          { name: 'B', category: 'cat2' }
        ] as any}
        links={[
          { source: 'A', target: 'B', value: 2 },
          { source: 'B', target: 'A', value: 3 },
          { source: 'X', target: 'Y', value: 1 }
        ] as any}
        legend={false}
        options={{}}
        fullScreen={true}
      />
    );

    const latestProps = echartsPropsSpy.mock.calls.at(-1)?.[0];
    expect(latestProps.style).toEqual({ height: '73.5vh' });

    const formatter = latestProps.option.tooltip.formatter as (params: any) => string;
    expect(formatter({ dataType: 'edge', data: { source: 'A', target: 'B', value: 5, prop: 'meta' } }))
      .toContain('A → B');
    expect(formatter({ dataType: 'node', data: { name: 'A', prop: 'p' } })).toContain('A');
    expect(formatter({ dataType: 'edge', data: { source: 'A', target: 'B', value: 0 } }))
      .toContain('Value: 0');
    expect(formatter({ dataType: 'node', data: { name: 'B' } })).toContain('B');

    const onCalls = onSpy.mock.calls;
    const mouseOver = onCalls.find(([eventName]) => eventName === 'mouseover')?.[1] as (payload: any) => void;
    const mouseOut = onCalls.find(([eventName]) => eventName === 'mouseout')?.[1] as (payload: any) => void;

    expect(mouseOver).toBeTypeOf('function');
    expect(mouseOut).toBeTypeOf('function');

    mouseOver({ dataType: 'node', data: { id: 'A' } });
    mouseOver({ dataType: 'edge', data: { source: 'A', target: 'B' } });
    mouseOver({ dataType: 'other', data: {} });
    mouseOut({ dataType: 'node' });
    mouseOut({ dataType: 'edge' });
    mouseOut({ dataType: 'other' });

    expect(setOptionSpy).toHaveBeenCalled();
    const serializedCalls = JSON.stringify(setOptionSpy.mock.calls);
    expect(serializedCalls).toContain('"width":3');
    expect(serializedCalls).toContain('"width":5');
    expect(serializedCalls).toContain('"source":"X"');
  });

  it('uses dark palette and non-fullscreen height', () => {
    localStorage.setItem('theme', 'dark');

    render(
      <HierarchicalEdgeBundlingGraphView
        nodes={[{ name: 'A', category: 'cat1' }] as any}
        links={[{ source: 'A', target: 'A', value: 1 }] as any}
        legend={false}
        options={{}}
        fullScreen={false}
      />
    );

    const latestProps = echartsPropsSpy.mock.calls.at(-1)?.[0];
    expect(latestProps.style).toEqual({ height: '100%' });
  });
});
