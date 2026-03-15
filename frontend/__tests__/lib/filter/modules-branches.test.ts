import { describe, it, expect, vi } from 'vitest';
import { applyAxisFilter } from '@/lib/filter/axis';
import { applyCalendarFilter } from '@/lib/filter/calendar';
import { applyFunnelPieFilter } from '@/lib/filter/funnelPie';
import { applyHierachyFilter, applyValuesFilterRecursive } from '@/lib/filter/hierarchy';
import { applyNodeLinkFilter } from '@/lib/filter/nodeLink';
import { applyScatterFilter } from '@/lib/filter/scatter';
import { applyTimelineFilter } from '@/lib/filter/timeline';
import { applyWordCloudFilter } from '@/lib/filter/wordcloud';

describe('filter modules branch coverage', () => {
  it('covers axis include/exclude/malformed branches', () => {
    const axisData = {
      headers: ['h1', 'h2', 'h3'],
      values: { row: [2, 4, 6] }
    } as any;

    expect(applyAxisFilter(["headers!=['h2']"], axisData)).toEqual({
      headers: ['h1', 'h3'],
      values: { row: [2, 6] }
    });

    expect(applyAxisFilter(['noop', 'values>=4'], axisData).values.row).toEqual([0, 4, 6]);
    expect(applyAxisFilter(['headers<>[x]'], axisData).headers).toEqual([]);
    expect(applyAxisFilter(["headers==['h1']"], axisData).headers).toEqual([]);
    expect(applyAxisFilter(['values>=2'], { headers: ['h1'], values: undefined } as any).values).toBeUndefined();
  });

  it('covers calendar categories and dates combinations', () => {
    const data = {
      categories: ['work', 'personal'],
      calendar: [
        { date: '2024-01-01', value: 1, category: 'work' },
        { date: '2024-02-01', value: 2, category: 'personal' },
        { date: '2024-03-01', value: 3 }
      ]
    } as any;

    expect(applyCalendarFilter(["categories!=['work']"], data).categories).toEqual(['personal']);
    expect(applyCalendarFilter(["categories=['missing']"], data).calendar).toEqual([]);
    expect(applyCalendarFilter(["categories==['work']"], data).categories).toEqual([]);

    const datesOnly = applyCalendarFilter(["dates>='2024-02-01'"], data);
    expect(datesOnly.calendar.length).toBe(2);
    expect(datesOnly.categories).toEqual(['personal']);
  });

  it('covers hierarchy recursion and filtering branches', () => {
    const data = {
      categories: ['root', 'leaf'],
      nodes: [
        {
          name: 'r',
          value: 10,
          children: [
            { name: 'a', value: 2 },
            { name: 'b', value: 20 }
          ]
        }
      ]
    } as any;

    expect(applyValuesFilterRecursive(data.nodes[0], ['>100'])).toBeUndefined();
    expect(applyValuesFilterRecursive(null as any, ['>1'])).toBeUndefined();

    const filtered = applyHierachyFilter(["categories!=['leaf']", 'values>=10'], data);
    expect(filtered.categories).toEqual(['root']);
    expect(filtered.nodes[0]?.children).toEqual([{ name: 'b', value: 20, children: [] }]);

    const noValuesOps = applyValuesFilterRecursive({ name: 'zero', value: 0, children: [] } as any, []);
    expect(noValuesOps).toEqual({ name: 'zero', value: 0, children: [] });

    const zeroValueFiltered = applyValuesFilterRecursive({ name: 'zero', value: 0, children: [] } as any, ['>=0']);
    expect(zeroValueFiltered).toEqual({ name: 'zero', value: 0, children: [] });

    const malformed = applyHierachyFilter(['values?', 'categories~[x]'], data);
    expect(malformed.categories).toEqual([]);
    expect(malformed.nodes.length).toBe(1);
    expect(applyHierachyFilter(["categories==['root']"], data).categories).toEqual([]);

    const onlyValues = applyHierachyFilter(['values>=1'], data);
    expect(onlyValues.categories).toEqual(['root', 'leaf']);

    const onlyCategories = applyHierachyFilter(["categories=['root']"], data);
    expect(onlyCategories.categories).toEqual(['root']);
  });

  it('covers node-link include/exclude/value and fallback branches', () => {
    const data = {
      nodes: [
        { name: 'n1', category: 'c1' },
        { name: 'n2', category: 'c2' },
        { name: 'n3', category: 'c3' }
      ],
      links: [
        { source: 'n1', target: 'n2', value: 2 },
        { source: 'n2', target: 'n3', value: 10 }
      ]
    } as any;

    expect(applyNodeLinkFilter(["sources!=['n1']"], data).links).toEqual([{ source: 'n2', target: 'n3', value: 10 }]);
    expect(applyNodeLinkFilter(["targets!=['n3']"], data).links).toEqual([{ source: 'n1', target: 'n2', value: 2 }]);
    expect(applyNodeLinkFilter(["names!=['n2']"], data).nodes.map((n) => n.name)).toEqual(['n1', 'n3']);
    expect(applyNodeLinkFilter(["sources==['n1']"], data).links).toEqual([]);
    expect(applyNodeLinkFilter(['values'], data).links).toEqual(data.links);
    expect(applyNodeLinkFilter(['categories=[x]'], data)).toEqual({ nodes: [], links: [] });
    expect(applyNodeLinkFilter(['categories'], data)).toEqual(data);

    const combined = applyNodeLinkFilter(
      [
        "targets=['n2']",
        "targets=['n3']",
        "names=['n1']",
        "names=['n2']",
        'values>=2',
        'values>=10'
      ],
      data
    );
    expect(combined.links).toEqual([{ source: '', target: '', value: 0, properties: '' }]);
  });

  it('covers scatter filter branches and malformed points fallback', () => {
    const data = {
      points: [[1, 5], [8, 10]],
      categories: ['a', 'b']
    } as any;

    expect(applyScatterFilter(["categories!=['b']"], data).categories).toEqual(['a']);
    expect(applyScatterFilter(['xCoord>=8'], data).points).toEqual([[0, 0], [8, 10]]);
    expect(applyScatterFilter(['yCoord>=10'], data).points).toEqual([[0, 0], [8, 10]]);
    expect(applyScatterFilter(["categories==['a']"], data).categories).toEqual([]);
    expect(applyScatterFilter(['categories~[a]'], data).categories).toEqual([]);
    expect(applyScatterFilter(['xCoord!'], data).points).toEqual(data.points);
    expect(applyScatterFilter(['yCoord!'], data).points).toEqual(data.points);
  });

  it('covers timeline author/type/date branches', () => {
    const data = {
      '2024-01-01': { events: [{ author: 'a1', type: 't1' }, { author: 'a2', type: 't2' }] },
      '2024-02-01': { events: [{ author: 'a2', type: 't1' }] },
      '2024-03-01': undefined
    } as any;

    expect(Object.keys(applyTimelineFilter(["dates<='2024-01-01'"], data))).toEqual(['2024-01-01']);
    expect(Object.keys(applyTimelineFilter(["authors!=['a2']"], data))).toEqual(['2024-01-01']);
    expect(Object.keys(applyTimelineFilter(["types=['none']"], data))).toEqual([]);
    expect(Object.keys(applyTimelineFilter(['dates'], data)).length).toBe(2);
    expect(Object.keys(applyTimelineFilter(['dates!'], data)).length).toBe(2);
    expect(Object.keys(applyTimelineFilter(['authors~[a1]'], data)).length).toBe(2);
    expect(Object.keys(applyTimelineFilter(['types~[t1]'], data)).length).toBe(2);
    expect(Object.keys(applyTimelineFilter(["authors==['a1']"], data)).length).toBe(2);
    expect(Object.keys(applyTimelineFilter(["types==['t1']"], data)).length).toBe(2);
  });

  it('covers calendar malformed expressions and empty operations', () => {
    const data = {
      categories: ['work', 'personal'],
      calendar: [
        { date: '2024-01-01', value: 1, category: 'work' },
        { date: '2024-02-01', value: 2, category: 'personal' }
      ]
    } as any;

    const malformedCategories = applyCalendarFilter(['categories~[work]'], data);
    expect(malformedCategories.categories).toEqual([]);

    const malformedDates = applyCalendarFilter(['dates!'], data);
    expect(malformedDates.calendar).toEqual(data.calendar);
  });

  it('covers funnel/pie and wordcloud empty-expression branches', () => {
    expect(applyFunnelPieFilter([], { values: { a: 1 } } as any)).toEqual({ values: {} });
    expect(applyFunnelPieFilter(['values'], { values: { a: 1, b: 2 } } as any)).toEqual({ values: { a: 1, b: 2 } });
    expect(applyFunnelPieFilter(['values>=1'], { values: undefined } as any).values).toBeUndefined();

    const words = [{ text: 'a', value: 1 }, { text: 'b', value: 2 }] as any;
    expect(applyWordCloudFilter([], words)).toEqual([]);
    expect(applyWordCloudFilter(['values'], words)).toEqual(words);
    expect(applyWordCloudFilter(['values>=1'], null as any)).toBeNull();
  });

  it('covers regex parser throw fallbacks', () => {
    const axisHeadersMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('axis-headers-match');
    });
    expect(applyAxisFilter(["headers=['h1']"], { headers: ['h1'], values: { row: [1] } } as any).headers).toEqual(['h1']);
    axisHeadersMatchSpy.mockRestore();

    const axisValuesMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('axis-values-match');
    });
    expect(applyAxisFilter(['values>=1'], { headers: ['h1'], values: { row: [1] } } as any).values).toEqual({ row: [1] });
    axisValuesMatchSpy.mockRestore();

    const calendarCategoriesMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('calendar-categories-match');
    });
    expect(applyCalendarFilter(["categories=['work']"], {
      categories: ['work'],
      calendar: [{ date: '2024-01-01', category: 'work' }]
    } as any).categories).toEqual(['work']);
    calendarCategoriesMatchSpy.mockRestore();

    const calendarDatesMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('calendar-dates-match');
    });
    expect(applyCalendarFilter(["dates>='2024-01-01'"], {
      categories: ['work'],
      calendar: [{ date: '2024-01-01', category: 'work' }]
    } as any).calendar).toEqual([{ date: '2024-01-01', category: 'work' }]);
    calendarDatesMatchSpy.mockRestore();

    const hierarchyValuesMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('hierarchy-values-match');
    });
    expect(applyHierachyFilter(['values>=1'], {
      categories: ['root'],
      nodes: [{ name: 'r', value: 1 }]
    } as any).nodes).toEqual([{ name: 'r', value: 1 }]);
    hierarchyValuesMatchSpy.mockRestore();

    const hierarchyCategoriesMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('hierarchy-categories-match');
    });
    expect(applyHierachyFilter(["categories=['root']"], {
      categories: ['root'],
      nodes: [{ name: 'r', value: 1 }]
    } as any).categories).toEqual(['root']);
    hierarchyCategoriesMatchSpy.mockRestore();

    const nodeLinkCategoryMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('node-link-categories-match');
    });
    expect(applyNodeLinkFilter(["categories=['x']"], {
      nodes: [{ name: 'n1', category: 'c1' }],
      links: []
    } as any)).toEqual({
      nodes: [{ name: 'n1', category: 'c1' }],
      links: []
    });
    nodeLinkCategoryMatchSpy.mockRestore();

    const nodeLinkValuesMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('node-link-values-match');
    });
    expect(applyNodeLinkFilter(['values>=1'], {
      nodes: [{ name: 'n1', category: 'c1' }],
      links: [{ source: 'n1', target: 'n1', value: 1 }]
    } as any)).toEqual({
      nodes: [{ name: 'n1', category: 'c1' }],
      links: [{ source: 'n1', target: 'n1', value: 1 }]
    });
    nodeLinkValuesMatchSpy.mockRestore();

    const scatterCategoriesMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('scatter-categories-match');
    });
    expect(applyScatterFilter(["categories=['a']"], {
      points: [[1, 1]],
      categories: ['a']
    } as any).categories).toEqual(['a']);
    scatterCategoriesMatchSpy.mockRestore();

    const scatterPointsMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('scatter-points-match');
    });
    expect(applyScatterFilter(['xCoord>=1'], {
      points: [[1, 1]],
      categories: ['a']
    } as any).points).toEqual([[1, 1]]);
    scatterPointsMatchSpy.mockRestore();

    const timelineDatesMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('timeline-dates-match');
    });
    const timelineFallback = applyTimelineFilter(["dates>='2024-01-01'"], { '2024-01-01': { events: [] } } as any);
    expect(timelineFallback).toEqual({ '2024-01-01': { events: [] } });
    timelineDatesMatchSpy.mockRestore();

    const timelineEventsMatchSpy = vi.spyOn(String.prototype, 'match').mockImplementationOnce(() => {
      throw new Error('timeline-events-match');
    });
    const timelineEventsFallback = applyTimelineFilter(["authors=['a1']"], { '2024-01-01': { events: [] } } as any);
    expect(timelineEventsFallback).toEqual({ '2024-01-01': { events: [] } });
    timelineEventsMatchSpy.mockRestore();
  });
});
