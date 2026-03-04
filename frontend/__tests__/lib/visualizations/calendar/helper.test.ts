import { describe, expect, it } from 'vitest';
import {
    computeCalendar,
    computeCategoriesCalendar,
    computeColors,
    computeLegendColors,
    computePropertiesForToolTip
} from '@/lib/visualizations/calendar/helper';

describe('lib/visualizations/calendar/helper', () => {
    const data = [
        { date: '2024-01-01', value: 2, category: 'work', properties: { a: 1 } },
        { date: '2023-12-30', value: 1, category: 'home', properties: 'ok' },
        { date: 'bad-date', value: 3, category: 'misc' }
    ] as any;

    it('computes categories and color maps', () => {
        const categories = computeCategoriesCalendar(data);
        expect(categories).toEqual(['work', 'home', 'misc']);
        expect(computeColors(categories, ['#111'])).toEqual({
            work: '#111',
            home: '#000000',
            misc: '#000000'
        });
        expect(computeLegendColors(categories, ['#111', '#222', '#333'])).toEqual({
            work: '#111',
            home: '#222',
            misc: '#333'
        });
    });

    it('computes tooltip content', () => {
        expect(computePropertiesForToolTip({ a: 1, b: 'x' }, 9)).toContain('value:9');
        expect(computePropertiesForToolTip('plain', undefined)).toContain('plain');
        expect(computePropertiesForToolTip(null, undefined)).toBe('');
    });

    it('computes calendar and series grouped by year', () => {
        const result = computeCalendar(data, '#fff');
        expect(result.calendar.length).toBe(2);
        expect(result.series.length).toBe(2);
        expect(result.calendar[0]?.dayLabel.textStyle.color).toBe('#fff');
        expect(result.series.some((s) => s.data.length > 0)).toBe(true);
        expect(result.encode).toEqual({ time: 0, value: 1, category: 2 });
    });
});
