import {
  afterEach, beforeEach, describe, expect, it, vi
} from 'vitest';
import * as echarts from 'echarts/core';
import { exportChart, exportDashboardCharts } from '@/lib/chart-export';

vi.mock('echarts/core', () => ({
  connect: vi.fn(() => 'dashboard-export-group'),
  disconnect: vi.fn(),
  getInstanceByDom: vi.fn()
}));

describe('lib/chart-export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:http://localhost/chart-export')
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn()
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads single chart SVG exports without requiring an SVG ECharts painter', async () => {
    const chart = {
      getDataURL: vi.fn(() => 'data:image/png;base64,chart-image'),
      getDom: vi.fn(() => ({
        getBoundingClientRect: () => ({ width: 640, height: 360 })
      })),
      getWidth: vi.fn(() => 640),
      getHeight: vi.fn(() => 360)
    };

    await exportChart({
      chart: chart as never,
      filename: 'Sales / Cost',
      format: 'svg'
    });

    const blob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0] as Blob | undefined;
    expect(blob).toBeInstanceOf(Blob);
    if (!blob) {
      throw new Error('Expected SVG export to create a Blob URL.');
    }
    expect(blob.type).toBe('image/svg+xml;charset=utf-8');
    await expect(blob.text()).resolves.toContain('<image href="data:image/png;base64,chart-image" width="640" height="360" />');
    expect(chart.getDataURL).toHaveBeenCalledWith({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      excludeComponents: ['toolbox']
    });
  });

  it('downloads dashboard SVG exports without calling ECharts connected SVG export', async () => {
    const chartElement = document.createElement('div');
    chartElement.setAttribute('_echarts_instance_', 'chart-id');
    const dashboardElement = document.createElement('section');
    dashboardElement.appendChild(chartElement);
    vi.spyOn(dashboardElement, 'getBoundingClientRect').mockReturnValue({
      width: 900,
      height: 420,
      x: 0,
      y: 0,
      top: 0,
      right: 900,
      bottom: 420,
      left: 0,
      toJSON: () => ({})
    });

    const chart = {
      group: '',
      getConnectedDataURL: vi.fn(() => 'data:image/png;base64,dashboard-image')
    };
    vi.mocked(echarts.getInstanceByDom).mockReturnValue(chart as never);

    await exportDashboardCharts({
      element: dashboardElement,
      filename: 'Main dashboard',
      format: 'svg'
    });

    const blob = vi.mocked(URL.createObjectURL).mock.calls[0]?.[0] as Blob | undefined;
    if (!blob) {
      throw new Error('Expected dashboard SVG export to create a Blob URL.');
    }

    expect(chart.getConnectedDataURL).toHaveBeenCalledWith({
      type: 'png',
      pixelRatio: 2,
      connectedBackgroundColor: '#ffffff',
      excludeComponents: ['toolbox']
    });
    await expect(blob.text()).resolves.toContain('<image href="data:image/png;base64,dashboard-image" width="900" height="420" />');
  });
});
