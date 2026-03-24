import { describe, expect, it } from 'vitest';
import { VisualizationTypes } from '@illustry/types';

describe('visualization enum', () => {
  it('keeps existing Illustry-native values unchanged', () => {
    expect(VisualizationTypes.VisualizationTypesEnum.LINE_CHART).toBe('line-chart');
    expect(VisualizationTypes.VisualizationTypesEnum.BAR_CHART).toBe('bar-chart');
    expect(VisualizationTypes.VisualizationTypesEnum.PIE_CHART).toBe('pie-chart');
  });

  it('includes official ECharts built-in series enum values', () => {
    expect(VisualizationTypes.VisualizationTypesEnum.EFFECT_SCATTER).toBe('effectScatter');
    expect(VisualizationTypes.VisualizationTypesEnum.CANDLESTICK).toBe('candlestick');
    expect(VisualizationTypes.VisualizationTypesEnum.RADAR).toBe('radar');
    expect(VisualizationTypes.VisualizationTypesEnum.HEATMAP).toBe('heatmap');
    expect(VisualizationTypes.VisualizationTypesEnum.TREE).toBe('tree');
    expect(VisualizationTypes.VisualizationTypesEnum.MAP).toBe('map');
    expect(VisualizationTypes.VisualizationTypesEnum.LINES).toBe('lines');
    expect(VisualizationTypes.VisualizationTypesEnum.GRAPH).toBe('graph');
    expect(VisualizationTypes.VisualizationTypesEnum.BOXPLOT).toBe('boxplot');
    expect(VisualizationTypes.VisualizationTypesEnum.PARALLEL).toBe('parallel');
    expect(VisualizationTypes.VisualizationTypesEnum.GAUGE).toBe('gauge');
    expect(VisualizationTypes.VisualizationTypesEnum.THEME_RIVER).toBe('themeRiver');
    expect(VisualizationTypes.VisualizationTypesEnum.PICTORIAL_BAR).toBe('pictorialBar');
    expect(VisualizationTypes.VisualizationTypesEnum.CUSTOM).toBe('custom');
  });
});
