import { describe, test, expect } from 'vitest';
import { computeCategoriesScatter, computeColors, computePoints } from '../../../../src/lib/visualizations/scatter/helper';
import { VisualizationTypes } from '@illustry/types';

describe('computeCategoriesScatter', () => {
    test('extracts unique categories from points', () => {
        const points: VisualizationTypes.ScatterPoint[] = [
            { category: 'cat1', value: [1, 2] },
            { category: 'cat2', value: [3, 4] },
            { category: 'cat1', value: [5, 6] },
            { category: 'cat3', value: [7, 8] },
        ];
        const result = computeCategoriesScatter(points);
        expect(result).toEqual(['cat1', 'cat2', 'cat3']);
    });

    test('handles empty points array', () => {
        const points: VisualizationTypes.ScatterPoint[] = [];
        const result = computeCategoriesScatter(points);
        expect(result).toEqual([]);
    });

    test('handles single point', () => {
        const points: VisualizationTypes.ScatterPoint[] = [
            { category: 'cat1', value: [1, 2] },
        ];
        const result = computeCategoriesScatter(points);
        expect(result).toEqual(['cat1']);
    });

    test('handles points with undefined category', () => {
        const points: VisualizationTypes.ScatterPoint[] = [
            { category: undefined, value: [1, 2] } as any,
            { category: 'cat1', value: [3, 4] },
        ];
        const result = computeCategoriesScatter(points);
        expect(result).toEqual(['cat1']);
    });

    test('handles points with empty category', () => {
        const points: VisualizationTypes.ScatterPoint[] = [
            { category: '', value: [1, 2] },
            { category: 'cat1', value: [3, 4] },
        ];
        const result = computeCategoriesScatter(points);
        expect(result).toEqual(['', 'cat1']);
    });
});

describe('computeColors', () => {
    test('maps categories to colors correctly', () => {
        const categories = ['cat1', 'cat2', 'cat3'];
        const colors = ['#FF0000', '#00FF00', '#0000FF'];
        const result = computeColors(categories, colors);
        expect(result).toEqual({
            cat1: '#FF0000',
            cat2: '#00FF00',
            cat3: '#0000FF',
        });
    });

    test('handles empty categories array', () => {
        const categories: string[] = [];
        const colors = ['#FF0000', '#00FF00'];
        const result = computeColors(categories, colors);
        expect(result).toEqual({});
    });

    test('handles empty colors array', () => {
        const categories = ['cat1', 'cat2'];
        const colors: string[] = [];
        const result = computeColors(categories, colors);
        expect(result).toEqual({ cat1: undefined, cat2: undefined });
    });

    test('handles colors shorter than categories', () => {
        const categories = ['cat1', 'cat2', 'cat3'];
        const colors = ['#FF0000', '#00FF00'];
        const result = computeColors(categories, colors);
        expect(result).toEqual({
            cat1: '#FF0000',
            cat2: '#00FF00',
            cat3: undefined,
        });
    });

    test('handles colors longer than categories', () => {
        const categories = ['cat1', 'cat2'];
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
        const result = computeColors(categories, colors);
        expect(result).toEqual({
            cat1: '#FF0000',
            cat2: '#00FF00',
        });
    });

    test('handles duplicate categories', () => {
        const categories = ['cat1', 'cat1', 'cat2'];
        const colors = ['#FF0000', '#00FF00', '#0000FF'];
        const result = computeColors(categories, colors);
        expect(result).toEqual({
            cat1: '#00FF00', // Last color wins
            cat2: '#0000FF',
        });
    });
});

describe('computePoints', () => {
    test('transforms points to [value..., category] arrays', () => {
        const points: VisualizationTypes.ScatterPoint[] = [
            { category: 'cat1', value: [1, 2] },
            { category: 'cat2', value: [3, 4] },
            { category: 'cat3', value: [5, 6] },
        ];
        const result = computePoints(points);
        expect(result).toEqual([
            [1, 2, 'cat1'],
            [3, 4, 'cat2'],
            [5, 6, 'cat3'],
        ]);
    });

    test('handles empty points array', () => {
        const points: VisualizationTypes.ScatterPoint[] = [];
        const result = computePoints(points);
        expect(result).toEqual([]);
    });

    test('handles single point', () => {
        const points: VisualizationTypes.ScatterPoint[] = [
            { category: 'cat1', value: [1, 2] },
        ];
        const result = computePoints(points);
        expect(result).toEqual([[1, 2, 'cat1']]);
    });

    test('handles points with empty value array', () => {
        const points: VisualizationTypes.ScatterPoint[] = [
            { category: 'cat1', value: [] } as any,
            { category: 'cat2', value: [3, 4] },
        ];
        const result = computePoints(points);
        expect(result).toEqual([['cat1'], [3, 4, 'cat2']]);
    });

    test('handles points with undefined value', () => {
        const points: VisualizationTypes.ScatterPoint[] = [
            { category: 'cat1', value: undefined } as any,
            { category: 'cat2', value: [3, 4] },
        ];
        const result = computePoints(points);
        expect(result).toEqual([[3, 4, 'cat2']]);
    });

    test('handles points with undefined category', () => {
        const points: VisualizationTypes.ScatterPoint[] = [
            { category: undefined, value: [1, 2] } as any,
            { category: 'cat2', value: [3, 4] },
        ];
        const result = computePoints(points);
        expect(result).toEqual([[3, 4, 'cat2']]);
    });

    test('handles points with empty category', () => {
        const points: VisualizationTypes.ScatterPoint[] = [
            { category: '', value: [1, 2] },
            { category: 'cat2', value: [3, 4] },
        ];
        const result = computePoints(points);
        expect(result).toEqual([[3, 4, 'cat2']]);
    });
});