import { describe, expect, it } from 'vitest';
import { applyAxisFilter } from '@/lib/filter/axis';
import { applyCalendarFilter } from '@/lib/filter/calendar';
import { applyFunnelPieFilter } from '@/lib/filter/funnelPie';
import { applyHierachyFilter, applyValuesFilterRecursive } from '@/lib/filter/hierarchy';
import { applyNodeLinkFilter } from '@/lib/filter/nodeLink';
import { applyScatterFilter } from '@/lib/filter/scatter';
import { applyTimelineFilter } from '@/lib/filter/timeline';
import { applyWordCloudFilter } from '@/lib/filter/wordcloud';

describe('lib/filter modules', () => {
    it('filters axis data by headers and values and handles malformed values source', () => {
        const axisData = {
            headers: ['a', 'b', 'c'],
            values: { s1: [1, 20, 3], s2: [5, 1, 8] }
        } as any;

        const filtered = applyAxisFilter(["headers=['a','c']", 'values>=2'], axisData);
        expect(filtered.headers).toEqual(['a', 'c']);
        expect(filtered.values.s1).toEqual([0, 3]);

        const malformed = applyAxisFilter(['values>=2'], { headers: ['a'], values: null } as any);
        expect(malformed.values).toBeNull();
    });

    it('filters calendar categories and dates', () => {
        const calendarData = {
            categories: ['work', 'personal'],
            calendar: [
                { date: '2024-01-01', value: 1, category: 'work' },
                { date: '2024-02-01', value: 2, category: 'personal' }
            ]
        } as any;

        const filtered = applyCalendarFilter(["categories=['work']", "dates>='2024-02-01'"], calendarData);
        expect(filtered.categories).toEqual(['work']);
        expect(filtered.calendar).toEqual([]);
    });

    it('filters funnel/pie values', () => {
        const data = { values: { a: 1, b: 5, c: 10 } } as any;
        const filtered = applyFunnelPieFilter(['values>=5'], data);
        expect(filtered.values).toEqual({ b: 5, c: 10 });
    });

    it('filters hierarchy values recursively and categories branch', () => {
        const data = {
            categories: ['x', 'y'],
            nodes: [
                { name: 'root', value: 10, children: [{ name: 'c1', value: 1 }, { name: 'c2', value: 20 }] }
            ]
        } as any;

        const recursive = applyValuesFilterRecursive(data.nodes[0], ['>=10']);
        expect(recursive?.children).toHaveLength(1);

        const filtered = applyHierachyFilter(['values>=10', "categories=['x']"], data);
        expect(filtered.nodes).toHaveLength(1);
        expect(filtered.categories).toEqual(['x']);
    });

    it('keeps untouched axis dimensions when only one filter type is used', () => {
        const axisData = {
            headers: ['a', 'b'],
            values: { s1: [1, 2] }
        } as any;
        expect(applyAxisFilter(["headers=['a']"], axisData)).toEqual({
            headers: ['a'],
            values: { s1: [1] }
        });
        expect(applyAxisFilter(['values>=2'], axisData)).toEqual({
            headers: ['a', 'b'],
            values: { s1: [0, 2] }
        });
    });

    it('filters node-link by categories/sources/targets/names/values', () => {
        const data = {
            nodes: [
                { name: 'n1', category: 'c1' },
                { name: 'n2', category: 'c2' },
                { name: 'n3', category: 'c3' }
            ],
            links: [
                { source: 'n1', target: 'n2', value: 1 },
                { source: 'n2', target: 'n3', value: 10 }
            ]
        } as any;

        expect(applyNodeLinkFilter(["categories=['c1','c2']"], data).nodes.length).toBeGreaterThan(0);
        expect(applyNodeLinkFilter(["sources=['n2']"], data).links).toEqual([
            { source: 'n2', target: 'n3', value: 10 }
        ]);
        expect(applyNodeLinkFilter(["targets=['n2']"], data).links).toEqual([
            { source: 'n1', target: 'n2', value: 1 }
        ]);
        expect(applyNodeLinkFilter(["names=['n1']"], data).nodes[0]?.name).toBe('n1');
        expect(applyNodeLinkFilter(['values>=10'], data).links[0]).toEqual({
            source: '',
            target: '',
            value: 0,
            properties: ''
        });
    });

    it('filters scatter points/categories', () => {
        const data = {
            points: [[1, 2], [10, 20]],
            categories: ['a', 'b']
        } as any;

        const filtered = applyScatterFilter(["categories=['a']", 'xCoord>=10', 'yCoord>=10'], data);
        expect(filtered.categories).toEqual(['a']);
        expect(filtered.points).toEqual([[0, 0], [10, 20]]);
    });

    it('filters timeline by dates/authors/types', () => {
        const data = {
            '2024-01-01': { events: [{ author: 'a1', type: 't1' }, { author: 'a2', type: 't2' }] },
            '2024-02-01': { events: [{ author: 'a2', type: 't1' }] }
        } as any;

        const filtered = applyTimelineFilter(["dates>='2024-02-01'", "authors=['a2']", "types=['t1']"], data);
        expect(Object.keys(filtered)).toEqual(['2024-02-01']);
        expect(filtered['2024-02-01']?.events).toEqual([{ author: 'a2', type: 't1' }]);
    });

    it('filters wordcloud values', () => {
        const words = [{ text: 'a', value: 1 }, { text: 'b', value: 10 }] as any;
        const filtered = applyWordCloudFilter(['values>=10'], words);
        expect(filtered).toEqual([{ text: 'b', value: 10 }]);
    });
});
