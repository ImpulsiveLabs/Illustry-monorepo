import { describe, test, expect } from 'vitest';
import { computeValues, computeLegendColors } from '../../../../src/lib/visualizations/pieFunnel/helper';
import { VisualizationTypes } from '@illustry/types';

describe('computeValues', () => {
    const data: VisualizationTypes.PieChartData = {
        values: {
            'A': 10,
            'B': undefined as any, 
            '': 20,
            'C': 30,
            'D': 0,
        },
    };
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];

    test('computes values with sufficient colors, applying conditions', () => {
        const result = computeValues(data, colors);
        expect(result).toEqual([
            { value: 10, name: 'A', itemStyle: { color: '#FF0000' } },
            { value: 30, name: 'C', itemStyle: { color: '#FFFF00' } },
        ]);
    });

    test('computes values with insufficient colors', () => {
        const shortColors = ['#FF0000', '#00FF00'];
        const result = computeValues(data, shortColors);
        expect(result).toEqual([
            { value: 10, name: 'A', itemStyle: { color: '#FF0000' } },
        ]);
    });

    test('computes values with empty colors array', () => {
        const result = computeValues(data, []);
        expect(result).toEqual([]);
    });

    test('computes values with empty values object', () => {
        const emptyData: VisualizationTypes.PieChartData = { values: {} };
        const result = computeValues(emptyData, colors);
        expect(result).toEqual([]);
    });

    test('computes values with all undefined or invalid entries', () => {
        const invalidData: VisualizationTypes.PieChartData = {
            values: { 'B': undefined as any, '': 20 },
        };
        const result = computeValues(invalidData, colors);
        expect(result).toEqual([]);
    });

    test('computes values with single valid entry', () => {
        const singleData: VisualizationTypes.PieChartData = {
            values: { 'A': 10, 'B': undefined as any, '': 20 },
        };
        const result = computeValues(singleData, colors);
        expect(result).toEqual([
            { value: 10, name: 'A', itemStyle: { color: '#FF0000' } },
        ]);
    });

  
});

describe('computeLegendColors', () => {
    const data: VisualizationTypes.PieChartData = {
        values: {
            'A': 10,
            'B': undefined as any,
            '': 20,
            'C': 30,
        },
    };
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];

    test('computes legend colors with sufficient colors', () => {
        const result = computeLegendColors(data, colors);
        expect(result).toEqual({
            A: '#FF0000',
            B: '#00FF00',
            C: '#FFFF00',
        });
    });
});