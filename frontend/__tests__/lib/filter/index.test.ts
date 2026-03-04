import { describe, expect, it, vi, beforeEach } from 'vitest';
import { VisualizationTypes } from '@illustry/types';

const {
    validateExpressions,
    applyAxisFilter,
    applyCalendarFilter,
    applyNodeLinkFilter,
    applyFunnelPieFilter,
    applyWordCloudFilter,
    applyScatterFilter,
    applyTimelineFilter,
    applyHierachyFilter
} = vi.hoisted(() => ({
    validateExpressions: vi.fn(),
    applyAxisFilter: vi.fn(() => ({ axis: true })),
    applyCalendarFilter: vi.fn(() => ({ calendar: true })),
    applyNodeLinkFilter: vi.fn(() => ({ nodeLink: true })),
    applyFunnelPieFilter: vi.fn(() => ({ funnelPie: true })),
    applyWordCloudFilter: vi.fn(() => ({ wordCloud: true })),
    applyScatterFilter: vi.fn(() => ({ scatter: true })),
    applyTimelineFilter: vi.fn(() => ({ timeline: true })),
    applyHierachyFilter: vi.fn(() => ({ hierarchy: true }))
}));

vi.mock('@/lib/filter/generic', () => ({ validateExpressions }));
vi.mock('@/lib/filter/axis', () => ({ applyAxisFilter }));
vi.mock('@/lib/filter/calendar', () => ({ applyCalendarFilter }));
vi.mock('@/lib/filter/nodeLink', () => ({ applyNodeLinkFilter }));
vi.mock('@/lib/filter/funnelPie', () => ({ applyFunnelPieFilter }));
vi.mock('@/lib/filter/wordcloud', () => ({ applyWordCloudFilter }));
vi.mock('@/lib/filter/scatter', () => ({ applyScatterFilter }));
vi.mock('@/lib/filter/timeline', () => ({ applyTimelineFilter }));
vi.mock('@/lib/filter/hierarchy', () => ({ applyHierachyFilter }));

import parseFilter from '@/lib/filter';

describe('lib/filter/index parseFilter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('routes each visualization type to the right filter function', () => {
        const data = {} as any;
        const words = ['values'];

        expect(parseFilter('values>=1&&values<=2', data, words, VisualizationTypes.VisualizationTypesEnum.LINE_CHART)).toEqual({ axis: true });
        expect(parseFilter('values>=1', data, words, VisualizationTypes.VisualizationTypesEnum.CALENDAR)).toEqual({ calendar: true });
        expect(parseFilter('values>=1', data, words, VisualizationTypes.VisualizationTypesEnum.MATRIX)).toEqual({ nodeLink: true });
        expect(parseFilter('values>=1', data, words, VisualizationTypes.VisualizationTypesEnum.FUNNEL)).toEqual({ funnelPie: true });
        expect(parseFilter('values>=1', data, words, VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD)).toEqual({ wordCloud: true });
        expect(parseFilter('values>=1', data, words, VisualizationTypes.VisualizationTypesEnum.SCATTER)).toEqual({ scatter: true });
        expect(parseFilter('values>=1', data, words, VisualizationTypes.VisualizationTypesEnum.TIMELINE)).toEqual({ timeline: true });
        expect(parseFilter('values>=1', data, words, VisualizationTypes.VisualizationTypesEnum.SUNBURST)).toEqual({ hierarchy: true });
        expect(parseFilter('values>=1', data, words, 'unknown' as VisualizationTypes.VisualizationTypesEnum)).toBe(data);

        expect(validateExpressions).toHaveBeenCalled();
    });

    it('wraps and rethrows validation errors with parse context', () => {
        validateExpressions.mockImplementationOnce(() => {
            throw new Error('bad expression');
        });

        expect(() => parseFilter(
            'values>=1',
            {} as any,
            ['values'],
            VisualizationTypes.VisualizationTypesEnum.LINE_CHART
        )).toThrow('The expression could not be parsed. bad expression');
    });
});
