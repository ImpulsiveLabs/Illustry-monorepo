import { describe, expect, it } from 'vitest';
import { computeLegendColors, constructSeries } from '@/lib/visualizations/chart/helper';

describe('lib/visualizations/chart/helper', () => {
    it('constructs series with stack and area options', () => {
        const series = constructSeries(
            { one: [1, 2], two: [3, 4] },
            ['#111', '#222'],
            true,
            'line',
            true
        );

        expect(series).toHaveLength(2);
        expect(series[0]).toMatchObject({
            name: 'one',
            stack: 'Total',
            type: 'line',
            color: '#111'
        });
        expect(series[0]?.areaStyle).toEqual({ color: '#111' });
    });

    it('constructs series without stack/area and computes legend colors fallback', () => {
        const series = constructSeries({ one: [1] }, [], false, 'bar');
        expect(series[0]).toMatchObject({ stack: undefined, type: 'bar' });

        const legend = computeLegendColors(
            { headers: ['x'], values: { one: [1], two: [2] } } as any,
            ['#111']
        );
        expect(legend).toEqual({ one: '#111', two: '' });
    });
});
