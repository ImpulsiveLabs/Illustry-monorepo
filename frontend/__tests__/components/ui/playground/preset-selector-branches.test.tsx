import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PresetSelector from '@/components/ui/playground/preset-selector';

const cases: Array<{ name: string; label: string; key: string; token: string }> = [
    { name: 'hierarchical-edge-bundling', label: 'Hierarchical Edge Bundling', key: 'heb', token: 'nodes' },
    { name: 'force-directed-graph', label: 'Forced Layout Graph', key: 'flg', token: 'nodes' },
    { name: 'sankey', label: 'Sankey', key: 'sankey', token: 'nodes' },
    { name: 'calendar', label: 'Calendar', key: 'calendar', token: 'calendar' },
    { name: 'word-cloud', label: 'WordCloud', key: 'wordCloud', token: 'words' },
    { name: 'matrix', label: 'Matrix', key: 'matrix', token: 'nodes' },
    { name: 'line-chart', label: 'Line Chart', key: 'lineChart', token: 'headers' },
    { name: 'bar-chart', label: 'Bar Chart', key: 'barChart', token: 'headers' },
    { name: 'pie-chart', label: 'Pie Chart', key: 'pieChart', token: 'values' },
    { name: 'funnel', label: 'Funnel', key: 'funnel', token: 'values' },
    { name: 'scatter', label: 'Scatter', key: 'scatter', token: 'points' },
    { name: 'treemap', label: 'Treemap', key: 'treeMap', token: 'name' },
    { name: 'sunburst', label: 'Sunburst', key: 'sunburst', token: 'name' },
    { name: 'timeline', label: 'Timeline', key: 'timeline', token: 'events' }
];

describe('PresetSelector toShowDiagram branches', () => {
    it.each(cases)('maps preset %s to diagram key and payload', async (testCase) => {
        const user = userEvent.setup();
        const setShowDiagram = vi.fn();
        const setTextareaValue = vi.fn();
        const setIsSubmitable = vi.fn();

        render(
            <PresetSelector
                presets={[{ id: testCase.key, name: testCase.name }]}
                setShowDiagram={setShowDiagram}
                setTextareaValue={setTextareaValue}
                setIsSubmitable={setIsSubmitable}
            />
        );

        await user.click(screen.getByRole('combobox', { name: 'Load a visualization...' }));
        await user.click(screen.getByText(testCase.label));

        const updater = setShowDiagram.mock.calls[0][0] as (prev: Record<string, boolean>) => Record<string, boolean>;
        const result = updater({
            heb: true,
            flg: true,
            sankey: true,
            calendar: true,
            wordCloud: true,
            matrix: true,
            lineChart: true,
            barChart: true,
            pieChart: true,
            funnel: true,
            scatter: true,
            treeMap: true,
            sunburst: true,
            timeline: true
        });

        Object.entries(result).forEach(([k, v]) => {
            expect(v).toBe(k === testCase.key);
        });

        expect(String(setTextareaValue.mock.calls[0][0])).toContain(testCase.token);
        expect(setIsSubmitable).toHaveBeenCalledWith(false);
    });
});
