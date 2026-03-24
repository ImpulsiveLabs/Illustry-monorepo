import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PresetActions from '@/components/ui/playground/preset-actions';
import PresetSelector, { VisualizationPresentation } from '@/components/ui/playground/preset-selector';

const { toastSpy } = vi.hoisted(() => ({
    toastSpy: vi.fn()
}));

vi.mock('sonner', () => ({
    toast: toastSpy
}));

describe('playground components', () => {
    it('opens preference dialog and delete confirmation from preset actions', async () => {
        const user = userEvent.setup();

        render(<PresetActions />);

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(screen.getByText('Content filter preferences'));
        expect(screen.getByText(/Playground warnings/i)).toBeInTheDocument();

        await user.click(screen.getByText('Close', { selector: 'button' }));

        await user.click(screen.getByRole('button', { name: 'Actions' }));
        await user.click(screen.getByText('Delete preset'));
        expect(screen.getByText('Are you sure?')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Delete' }));
        expect(toastSpy).toHaveBeenCalledWith('This preset has been deleted.');
    });

    it('selects known visualization preset and updates all callbacks', async () => {
        const user = userEvent.setup();
        const setShowDiagram = vi.fn();
        const setTextareaValue = vi.fn();
        const setIsSubmitable = vi.fn();

        const presets: VisualizationPresentation[] = [
            { id: '1', name: 'line-chart' }
        ];

        render(
            <PresetSelector
                presets={presets}
                setShowDiagram={setShowDiagram}
                setTextareaValue={setTextareaValue}
                setIsSubmitable={setIsSubmitable}
            />
        );

        await user.click(screen.getByRole('combobox', { name: 'Load a visualization...' }));
        await user.click(screen.getByText('Line Chart'));

        expect(setShowDiagram).toHaveBeenCalledTimes(1);
        const updater = setShowDiagram.mock.calls[0][0] as (prev: Record<string, boolean>) => Record<string, boolean>;
        const result = updater({ lineChart: false, barChart: true, scatter: true });
        expect(result.lineChart).toBe(true);
        expect(result.barChart).toBe(false);
        expect(result.scatter).toBe(false);

        expect(setTextareaValue).toHaveBeenCalledWith(expect.stringContaining('headers'));
        expect(setIsSubmitable).toHaveBeenCalledWith(false);

        await waitFor(() => {
            expect(screen.getByRole('combobox')).toHaveTextContent('Line Chart');
        });
    });

    it('handles unknown preset with empty textarea and all diagrams disabled', async () => {
        const user = userEvent.setup();
        const setShowDiagram = vi.fn();
        const setTextareaValue = vi.fn();
        const setIsSubmitable = vi.fn();

        render(
            <PresetSelector
                presets={[{ id: 'u1', name: 'unknown-type' }]}
                setShowDiagram={setShowDiagram}
                setTextareaValue={setTextareaValue}
                setIsSubmitable={setIsSubmitable}
            />
        );

        await user.click(screen.getByRole('combobox', { name: 'Load a visualization...' }));
        await user.click(screen.getByText('unknown-type'));

        const updater = setShowDiagram.mock.calls[0][0] as (prev: Record<string, boolean>) => Record<string, boolean>;
        const result = updater({ a: true, b: true });
        expect(result).toEqual({ a: false, b: false });
        expect(setTextareaValue).toHaveBeenCalledWith('');
        expect(setIsSubmitable).toHaveBeenCalledWith(false);
    });
});
