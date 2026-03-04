import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PresetSelector from '@/components/ui/playground/preset-selector';

const cases: Array<{ name: string; key: string; token: string }> = [
    { name: 'hierarchical-edge-bundling', key: 'heb', token: 'nodes' },
    { name: 'force-directed-graph', key: 'flg', token: 'nodes' },
    { name: 'sankey', key: 'sankey', token: 'nodes' },
    { name: 'calendar', key: 'calendar', token: 'calendar' },
    { name: 'word-cloud', key: 'wordCloud', token: 'words' },
    { name: 'matrix', key: 'matrix', token: 'nodes' },
    { name: 'line-chart', key: 'lineChart', token: 'headers' },
    { name: 'bar-chart', key: 'barChart', token: 'headers' },
    { name: 'pie-chart', key: 'pieChart', token: 'values' },
    { name: 'funnel', key: 'funnel', token: 'values' },
    { name: 'scatter', key: 'scatter', token: 'points' },
    { name: 'treemap', key: 'treeMap', token: 'name' },
    { name: 'sunburst', key: 'sunburst', token: 'name' },
    { name: 'timeline', key: 'timeline', token: 'events' }
];

describe('PresetSelector toShowDiagram branches', () => {
    it('maps every known preset name to diagram key and payload', async () => {
        const user = userEvent.setup();

        for (const [i, testCase] of cases.entries()) {
            const setShowDiagram = vi.fn();
            const setTextareaValue = vi.fn();
            const setIsSubmitable = vi.fn();

            render(
                <PresetSelector
                    presets={[{ id: String(i), name: testCase.name }]}
                    setShowDiagram={setShowDiagram}
                    setTextareaValue={setTextareaValue}
                    setIsSubmitable={setIsSubmitable}
                />
            );

            await user.click(screen.getAllByRole('combobox', { name: 'Load a visualization...' }).at(-1)!);
            await user.click(screen.getByText(testCase.name));

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
        }
    });
});
