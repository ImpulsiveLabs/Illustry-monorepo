import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeShell from '@/components/shells/theme-shell';
import PlaygroundShell from '@/components/shells/playground-shell';

const { themeDispatch, catchErrorSpy, validateWithSchemaSpy } = vi.hoisted(() => ({
    themeDispatch: vi.fn(),
    catchErrorSpy: vi.fn(),
    validateWithSchemaSpy: vi.fn()
}));
let themeDispatchEnabled = true;

vi.mock('@/components/providers/theme-provider', () => ({
    useThemeColors: () => ({
        sankey: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } },
        calendar: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } },
        flg: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } },
        wordcloud: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } },
        heb: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } },
        lineChart: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } },
        barChart: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } },
        scatter: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } },
        pieChart: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } },
        treeMap: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } },
        sunburst: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } },
        funnel: { light: { colors: ['#111', '#222', '#333'] }, dark: { colors: ['#111', '#222', '#333'] } }
    }),
    useThemeColorsDispach: () => (themeDispatchEnabled ? themeDispatch : undefined)
}));

vi.mock('@/lib/utils', async () => {
    const actual = await vi.importActual<any>('@/lib/utils');
    return {
        ...actual,
        catchError: catchErrorSpy
    };
});

vi.mock('@illustry/types', async () => {
    const actual = await vi.importActual<any>('@illustry/types');
    return {
        ...actual,
        ValidatorSchemas: {
            ...actual.ValidatorSchemas,
            validateWithSchema: validateWithSchemaSpy
        }
    };
});

vi.mock('@/components/ui/theme/default-themes', () => ({
    default: ({ handleApplyTheme }: any) => (
        <button onClick={() => handleApplyTheme('default')}>apply-default-theme</button>
    )
}));

vi.mock('@/components/ui/theme/generic-themes', () => ({
    default: ({
        handleColorAdd,
        handleColorDelete,
        handleColorChange,
        visualization
    }: any) => (
        <div>
            <button onClick={() => handleColorAdd(visualization, 'light')}>add-color-{visualization}</button>
            <button onClick={() => handleColorDelete(visualization, 'light')}>delete-color-{visualization}</button>
            <button onClick={() => handleColorChange('#ffffff', 0, visualization, 'light')}>change-color-{visualization}</button>
        </div>
    )
}));

vi.mock('@monaco-editor/react', () => ({
    default: ({ value, onChange }: any) => (
        <textarea
            data-testid="editor"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}));

vi.mock('@/components/ui/playground/preset-selector', () => ({
    default: ({ setShowDiagram, setTextareaValue, setIsSubmitable }: any) => (
        <>
            {[
                ['line', 'lineChart', { headers: ['x'], values: [[1]] }],
                ['sankey', 'sankey', { nodes: [{ name: 'a' }], links: [] }],
                ['matrix', 'matrix', { nodes: [{ name: 'a' }], links: [] }],
                ['heb', 'heb', { nodes: [{ name: 'a' }], links: [] }],
                ['flg', 'flg', { nodes: [{ name: 'a' }], links: [] }],
                ['word', 'wordCloud', { words: [{ text: 'a', value: 1 }] }],
                ['funnel', 'funnel', { names: ['a'], values: [1] }],
                ['pie', 'pieChart', { names: ['a'], values: [1] }],
                ['scatter', 'scatter', { points: [[1, 2]], categories: ['a'] }],
                ['sunburst', 'sunburst', { nodes: [{ name: 'r' }] }],
                ['treemap', 'treeMap', { nodes: [{ name: 'r' }] }],
                ['calendar', 'calendar', { calendar: [{ date: '2020-01-01', value: 1 }] }],
                ['timeline', 'timeline', { timeline: [{ start: '2020-01-01', end: '2020-01-02', text: 'x' }] }]
            ].map(([label, key, payload]) => (
                <button
                    key={String(label)}
                    onClick={() => {
                        setShowDiagram((prev: any) => Object.fromEntries(Object.keys(prev).map((k) => [k, false])));
                        setShowDiagram((prev: any) => ({ ...prev, [key]: true }));
                        setTextareaValue(JSON.stringify(payload));
                        setIsSubmitable(false);
                    }}
                >
                    {`preset-${label}`}
                </button>
            ))}
            <button
                onClick={() => {
                    setShowDiagram((prev: any) => ({ ...Object.fromEntries(Object.keys(prev).map((k) => [k, false])), barChart: true, lineChart: true }));
                    setTextareaValue(JSON.stringify({ headers: ['x'], values: [[1]] }));
                    setIsSubmitable(true);
                }}
            >
                preset-multi
            </button>
        </>
    )
}));

vi.mock('@/components/shells/sankey/sankey-shell', () => ({ default: () => <div data-testid="sankey-shell" /> }));
vi.mock('@/components/shells/wordcloud/wordcloud-shell', () => ({ default: () => <div data-testid="wordcloud-shell" /> }));
vi.mock('@/components/shells/treemap/treemap-shell', () => ({ default: () => <div data-testid="treemap-shell" /> }));
vi.mock('@/components/shells/sunburst/sunburst-shell', () => ({ default: () => <div data-testid="sunburst-shell" /> }));
vi.mock('@/components/shells/scatter/scatter-shell', () => ({ default: () => <div data-testid="scatter-shell" /> }));
vi.mock('@/components/shells/pie-chart/piechart-shell', () => ({ default: () => <div data-testid="pie-shell" /> }));
vi.mock('@/components/shells/forced-layout-graph/forced-layout-graph-shell', () => ({ default: () => <div data-testid="flg-shell" /> }));
vi.mock('@/components/shells/calendar/calendar-shell', () => ({ default: () => <div data-testid="calendar-shell" /> }));
vi.mock('@/components/shells/funnel/funnel-shell', () => ({ default: () => <div data-testid="funnel-shell" /> }));
vi.mock('@/components/shells/axis/axis-shell', () => ({ default: ({ type }: any) => <div data-testid={`axis-${type}`} /> }));
vi.mock('@/components/shells/hierarchical-edge-bundling/hierarchical-edge-bundling-shell', () => ({ default: () => <div data-testid="heb-shell" /> }));
vi.mock('@/components/shells/matrix/matrix-shell', () => ({ default: () => <div data-testid="matrix-shell" /> }));
vi.mock('@/components/shells/timeline/timeline-shell', () => ({ default: () => <div data-testid="timeline-shell" /> }));

vi.mock('@/components/ui/scroll-area', () => ({ ScrollArea: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/ui/fallback', () => ({ default: () => <div>fallback</div> }));

describe('theme + playground shells', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        themeDispatchEnabled = true;
    });

    it('applies default theme and renders selected theme preview shell', async () => {
        const user = userEvent.setup();
        render(<ThemeShell />);

        await user.click(screen.getByRole('button', { name: 'Default Schemes' }));
        await user.click(screen.getByRole('button', { name: 'apply-default-theme' }));
        expect(themeDispatch).toHaveBeenCalled();

        await user.click(screen.getByText('Sankey Diagram'));
        expect(screen.getByTestId('sankey-shell')).toBeInTheDocument();

        await user.click(screen.getByText('Forced-Layout-Graph'));
        expect(screen.getByTestId('flg-shell')).toBeInTheDocument();

        await user.click(screen.getByText('Hierarchical-Edge-Bundling'));
        expect(screen.getByTestId('heb-shell')).toBeInTheDocument();

        await user.click(screen.getByText('Word-Cloud'));
        expect(screen.getByTestId('wordcloud-shell')).toBeInTheDocument();

        await user.click(screen.getByText('Line-Chart'));
        expect(screen.getByTestId('axis-line')).toBeInTheDocument();

        await user.click(screen.getByText('Bar-Chart'));
        expect(screen.getByTestId('axis-bar')).toBeInTheDocument();

        await user.click(screen.getByText('Funnel'));
        expect(screen.getByTestId('funnel-shell')).toBeInTheDocument();

        await user.click(screen.getByText('Pie-Chart'));
        expect(screen.getByTestId('pie-shell')).toBeInTheDocument();

        await user.click(screen.getByText('Scatter'));
        expect(screen.getByTestId('scatter-shell')).toBeInTheDocument();

        await user.click(screen.getByText('TreeMap'));
        expect(screen.getByTestId('treemap-shell')).toBeInTheDocument();

        await user.click(screen.getByText('Sunburst'));
        expect(screen.getByTestId('sunburst-shell')).toBeInTheDocument();
    }, 45000);

    it('dispatches color mutations from generic theme controls', async () => {
        const user = userEvent.setup();
        render(<ThemeShell />);

        await user.click(screen.getByText('Calendar'));
        await user.click(screen.getByRole('button', { name: 'add-color-calendar' }));
        await user.click(screen.getByRole('button', { name: 'delete-color-calendar' }));
        await user.click(screen.getByRole('button', { name: 'change-color-calendar' }));

        await waitFor(() => {
            expect(themeDispatch).toHaveBeenCalled();
        });
    });

    const presetCases: Array<[string, string]> = [
        ['preset-line', 'axis-line'],
        ['preset-sankey', 'sankey-shell'],
        ['preset-matrix', 'matrix-shell'],
        ['preset-heb', 'heb-shell'],
        ['preset-flg', 'flg-shell'],
        ['preset-word', 'wordcloud-shell'],
        ['preset-funnel', 'funnel-shell'],
        ['preset-pie', 'pie-shell'],
        ['preset-scatter', 'scatter-shell'],
        ['preset-sunburst', 'sunburst-shell'],
        ['preset-treemap', 'treemap-shell'],
        ['preset-calendar', 'calendar-shell'],
        ['preset-timeline', 'timeline-shell']
    ];

    it.each(presetCases)('submits %s playground payload and renders shell %s', async (preset, testId) => {
        const user = userEvent.setup();
        render(<PlaygroundShell />);

        await user.click(screen.getByRole('button', { name: preset }));
        await user.click(screen.getByRole('button', { name: 'Submit' }));

        expect(screen.getByTestId(testId)).toBeInTheDocument();
        expect(validateWithSchemaSpy).toHaveBeenCalled();
    });

    it('handles invalid json submit in playground', async () => {
        const user = userEvent.setup();
        render(<PlaygroundShell />);

        fireEvent.change(screen.getByTestId('editor'), { target: { value: '{invalid' } });
        await user.click(screen.getByRole('button', { name: 'Submit' }));

        await waitFor(() => {
            expect(catchErrorSpy).toHaveBeenCalled();
        });
    });

    it('covers theme handlers and playground default-path branches', async () => {
        const user = userEvent.setup();

        themeDispatchEnabled = false;
        render(<ThemeShell />);
        await user.click(screen.getByRole('button', { name: 'Default Schemes' }));
        await user.click(screen.getByRole('button', { name: 'apply-default-theme' }));
        await user.click(screen.getByText('Calendar'));
        await user.click(screen.getByRole('button', { name: 'add-color-calendar' }));
        await user.click(screen.getByRole('button', { name: 'delete-color-calendar' }));
        await user.click(screen.getByRole('button', { name: 'change-color-calendar' }));
        expect(themeDispatch).not.toHaveBeenCalled();
    });

    it('keeps diagram hidden before submit and handles multiple-active default validation switch', async () => {
        const user = userEvent.setup();
        render(<PlaygroundShell />);

        await user.click(screen.getByRole('button', { name: 'preset-line' }));
        expect(screen.queryByTestId('axis-line')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'preset-multi' }));
        await user.click(screen.getByRole('button', { name: 'Submit' }));
        expect(validateWithSchemaSpy).not.toHaveBeenCalled();
    });
});
