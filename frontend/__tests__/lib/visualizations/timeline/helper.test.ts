import { describe, test, expect } from 'vitest';
import { computeColors, extractTimelineDataTypes, groupEventsByDate } from '../../../../src/lib/visualizations/timeline/helper';
import { VisualizationTypes } from '@illustry/types';

describe('computeColors', () => {
    test('maps types to colors correctly', () => {
        const types = ['cat1', 'cat2', 'cat3'];
        const colors = ['#FF0000', '#00FF00', '#0000FF'];
        const result = computeColors(types, colors);
        expect(result).toEqual({
            cat1: '#FF0000',
            cat2: '#00FF00',
            cat3: '#0000FF',
        });
    });

    test('handles empty types array', () => {
        const types: string[] = [];
        const colors = ['#FF0000', '#00FF00'];
        const result = computeColors(types, colors);
        expect(result).toEqual({});
    });

    test('handles empty colors array', () => {
        const types = ['cat1', 'cat2'];
        const colors: string[] = [];
        const result = computeColors(types, colors);
        expect(result).toEqual({ cat1: undefined, cat2: undefined });
    });

    test('handles colors shorter than types', () => {
        const types = ['cat1', 'cat2', 'cat3'];
        const colors = ['#FF0000', '#00FF00'];
        const result = computeColors(types, colors);
        expect(result).toEqual({
            cat1: '#FF0000',
            cat2: '#00FF00',
            cat3: undefined,
        });
    });

    test('handles colors longer than types', () => {
        const types = ['cat1', 'cat2'];
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
        const result = computeColors(types, colors);
        expect(result).toEqual({
            cat1: '#FF0000',
            cat2: '#00FF00',
        });
    });

    test('handles duplicate types', () => {
        const types = ['cat1', 'cat1', 'cat2'];
        const colors = ['#FF0000', '#00FF00', '#0000FF'];
        const result = computeColors(types, colors);
        expect(result).toEqual({
            cat1: '#00FF00', // Last color wins
            cat2: '#0000FF',
        });
    });
});

describe('extractTimelineDataTypes', () => {
    test('extracts unique event types from timeline data', () => {
        const data: VisualizationTypes.TimelineData = {
            '2023-01-01': {
                events: [
                    {
                        date: '2023-01-01', type: 'meeting',
                        summary: '',
                        author: ''
                    },
                    {
                        date: '2023-01-01', type: 'task',
                        summary: '',
                        author: ''
                    },
                ],
            },
            '2023-01-02': {
                events: [
                    {
                        date: '2023-01-02', type: 'task',
                        summary: '',
                        author: ''
                    },
                    {
                        date: '2023-01-02', type: 'call',
                        summary: '',
                        author: ''
                    },
                ],
            },
        };
        const result = extractTimelineDataTypes(data);
        expect(result).toEqual(['meeting', 'task', 'call']);
    });

    test('handles empty timeline data', () => {
        const data: VisualizationTypes.TimelineData = {};
        const result = extractTimelineDataTypes(data);
        expect(result).toEqual([]);
    });

    test('handles data with no events', () => {
        const data: VisualizationTypes.TimelineData = {
            '2023-01-01': { events: [] },
            '2023-01-02': { events: [] },
        };
        const result = extractTimelineDataTypes(data);
        expect(result).toEqual([]);
    });

    test('handles data with undefined events', () => {
        const data: VisualizationTypes.TimelineData = {
            '2023-01-01': { events: undefined } as any,
            '2023-01-02': { events: undefined } as any,
        };
        const result = extractTimelineDataTypes(data);
        expect(result).toEqual([]);
    });

    test('handles data with missing date entry', () => {
        const data: VisualizationTypes.TimelineData = {
            '2023-01-01': undefined as any,
        };
        const result = extractTimelineDataTypes(data);
        expect(result).toEqual([]);
    });

    test('handles duplicate event types', () => {
        const data: VisualizationTypes.TimelineData = {
            '2023-01-01': {
                events: [
                    {
                        date: '2023-01-01', type: 'meeting',
                        summary: '',
                        author: ''
                    },
                    {
                        date: '2023-01-01', type: 'meeting',
                        summary: '',
                        author: ''
                    },
                ],
            },
            '2023-01-02': {
                events: [{
                    date: '2023-01-02', type: 'meeting',
                    summary: '',
                    author: ''
                }],
            },
        };
        const result = extractTimelineDataTypes(data);
        expect(result).toEqual(['meeting']);
    });
});

describe('groupEventsByDate', () => {
    test('groups events by date correctly', () => {
        const events: VisualizationTypes.TimelineEvent[] = [
            {
                date: '2023-01-01', type: 'meeting',
                summary: '',
                author: ''
            },
            {
                date: '2023-01-01', type: 'task',
                summary: '',
                author: ''
            },
            {
                date: '2023-01-02', type: 'call',
                summary: '',
                author: ''
            },
        ];
        const result = groupEventsByDate(events);
        expect(result).toEqual({
            '2023-01-01': [
                {
                    date: '2023-01-01', type: 'meeting', summary: '',
                    author: ''
                },
                {
                    date: '2023-01-01', type: 'task', summary: '',
                    author: ''
                },
            ],
            '2023-01-02': [{
                date: '2023-01-02', type: 'call', summary: '',
                author: ''
            }],
        });
    });

    test('handles empty events array', () => {
        const events: VisualizationTypes.TimelineEvent[] = [];
        const result = groupEventsByDate(events);
        expect(result).toEqual({});
    });

    test('handles single event', () => {
        const events: VisualizationTypes.TimelineEvent[] = [
            {
                date: '2023-01-01', type: 'meeting', summary: '',
                author: ''
            },
        ];
        const result = groupEventsByDate(events);
        expect(result).toEqual({
            '2023-01-01': [{
                date: '2023-01-01', type: 'meeting', summary: '',
                author: ''
            }],
        });
    });

    test('handles multiple events on same date', () => {
        const events: VisualizationTypes.TimelineEvent[] = [
            {
                date: '2023-01-01', type: 'meeting', summary: '',
                author: ''
            },
            {
                date: '2023-01-01', type: 'task', summary: '',
                author: ''
            },
            {
                date: '2023-01-01', type: 'call', summary: '',
                author: ''
            },
        ];
        const result = groupEventsByDate(events);
        expect(result).toEqual({
            '2023-01-01': [
                {
                    date: '2023-01-01', type: 'meeting', summary: '',
                    author: ''
                },
                {
                    date: '2023-01-01', type: 'task', summary: '',
                    author: ''
                },
                {
                    date: '2023-01-01', type: 'call', summary: '',
                    author: ''
                },
            ],
        });
    });

    test('handles events with empty date', () => {
        const events: VisualizationTypes.TimelineEvent[] = [
            {
                date: '', type: 'meeting', summary: '',
                author: ''
            },
            {
                date: '', type: 'task', summary: '',
                author: ''
            },
        ];
        const result = groupEventsByDate(events);
        expect(result).toEqual({});
    });
});