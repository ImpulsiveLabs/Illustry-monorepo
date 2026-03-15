import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DefaultThemesAccordion from '@/components/ui/theme/default-themes';
import GenericThemesAccordion from '@/components/ui/theme/generic-themes';

const { themeState } = vi.hoisted(() => ({
    themeState: {
        sankey: {
            light: { colors: ['#112233', '#445566', '#778899'] },
            dark: { colors: ['#112233', '#445566', '#778899'] }
        }
    }
}));

vi.mock('@/components/providers/theme-provider', () => ({
    useThemeColors: () => themeState
}));

vi.mock('@/components/icons', () => ({
    default: {
        close: (props: any) => <span {...props}>close</span>,
        add: (props: any) => <span {...props}>add</span>,
        remove: (props: any) => <span {...props}>remove</span>
    }
}));

vi.mock('@/components/ui/colorPicker', () => ({
    default: ({ changeColor }: any) => (
        <button onClick={() => changeColor('#ffffff')} data-testid="color-picker">
            pick
        </button>
    )
}));

describe('theme ui components', () => {
    it('applies default palette on click and keyboard', async () => {
        const user = userEvent.setup();
        const handleApplyTheme = vi.fn();

        render(
            <DefaultThemesAccordion
                colorPalette={{ primary: ['#111111', '#222222'], secondary: ['#333333'] }}
                handleApplyTheme={handleApplyTheme}
            />
        );

        const buttons = screen.getAllByRole('button');
        await user.click(buttons[0]);
        fireEvent.keyDown(buttons[1], { key: 'Enter' });
        fireEvent.keyDown(buttons[1], { key: ' ' });
        fireEvent.keyDown(buttons[1], { key: 'Escape' });

        expect(handleApplyTheme).toHaveBeenCalledWith('primary');
        expect(handleApplyTheme).toHaveBeenCalledWith('secondary');
    });

    it('renders selected scheme indicator and tolerates undefined color entries', () => {
        const handleApplyTheme = vi.fn();

        render(
            <DefaultThemesAccordion
                colorPalette={{ primary: ['#111111'], empty: undefined as unknown as string[] }}
                handleApplyTheme={handleApplyTheme}
                selectedSchemeName="primary"
            />
        );

        expect(document.querySelector('.bg-blue-600')).toBeInTheDocument();
    });

    it('renders generic theme tabs and handles add/delete/input interactions', async () => {
        const user = userEvent.setup();
        const handleColorChange = vi.fn();
        const handleColorDelete = vi.fn();
        const handleColorAdd = vi.fn();

        render(
            <GenericThemesAccordion
                handleColorChange={handleColorChange}
                visualization="sankey"
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
            />
        );

        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByText('Dark')).toBeInTheDocument();

        const colorInputs = screen.getAllByPlaceholderText('#FFFFFF');
        fireEvent.change(colorInputs[0], { target: { value: '#ffffff' } });
        fireEvent.blur(colorInputs[0]);
        expect(handleColorChange).toHaveBeenCalled();

        const swatches = screen.getAllByRole('button', { name: /Open color picker/i });
        fireEvent.click(swatches[0]);

        const addButtons = screen.getAllByRole('button').filter((b) => b.className.includes('hover:bg-gray-100'));
        fireEvent.click(addButtons[0]);
        fireEvent.click(addButtons[1]);
        expect(handleColorAdd).toHaveBeenCalledWith('sankey', 'light');
        expect(handleColorDelete).not.toHaveBeenCalled();
    });

    it('renders color picker popover for active index and handles outside click', async () => {
        const handleColorChange = vi.fn();

        render(
            <GenericThemesAccordion
                handleColorChange={handleColorChange}
                visualization="sankey"
                handleColorDelete={vi.fn()}
                handleColorAdd={vi.fn()}
            />
        );

        fireEvent.click(screen.getAllByRole('button', { name: /Open color picker/i })[0]);
        expect(screen.getByTestId('color-picker')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('color-picker'));
        fireEvent.click(screen.getAllByRole('button', { name: /Open color picker/i })[0]);
        const closeButton = screen.queryByRole('button', { name: /Close color picker/i });
        if (closeButton) {
            fireEvent.click(closeButton);
        }
        expect(handleColorChange).toHaveBeenCalled();
    });

    it('rejects invalid hex input and restores original color on blur', async () => {
        const user = userEvent.setup();
        const handleColorChange = vi.fn();

        render(
            <GenericThemesAccordion
                handleColorChange={handleColorChange}
                visualization="sankey"
                handleColorDelete={vi.fn()}
                handleColorAdd={vi.fn()}
            />
        );

        const input = screen.getAllByPlaceholderText('#FFFFFF')[0] as HTMLInputElement;
        await user.clear(input);
        await user.type(input, 'invalid');
        fireEvent.blur(input);

        if (handleColorChange.mock.calls.length > 0) {
            expect(handleColorChange).toHaveBeenCalledWith('#112233', 0, 'sankey', 'light');
        }
        expect(input.value).toBe('#112233');
    });

    it('keeps add/delete actions disabled at boundary lengths', () => {
        themeState.sankey.light.colors = ['#1', '#2', '#3', '#4', '#5', '#6', '#7', '#8', '#9', '#10'];
        themeState.sankey.dark.colors = ['#1', '#2', '#3'];
        const handleColorAdd = vi.fn();
        const handleColorDelete = vi.fn();

        const { unmount } = render(
            <GenericThemesAccordion
                handleColorChange={vi.fn()}
                visualization="sankey"
                handleColorDelete={handleColorDelete}
                handleColorAdd={handleColorAdd}
            />
        );

        const disabledButtons = screen.getAllByRole('button')
            .filter((button) => button.className.includes('pointer-events-none'));

        disabledButtons.forEach((button) => {
            fireEvent.click(button as HTMLElement);
        });
        expect(handleColorAdd).not.toHaveBeenCalled();
        expect(handleColorDelete).not.toHaveBeenCalled();

        unmount();
        themeState.sankey.light.colors = ['#112233', '#445566', '#778899'];
        themeState.sankey.dark.colors = ['#112233', '#445566', '#778899'];
    });

    it('handles sparse palette colors and executes delete action when allowed', () => {
        themeState.sankey.light.colors = ['#111111', undefined as unknown as string, '#333333', '#444444'];
        themeState.sankey.dark.colors = ['#111111', '#222222', '#333333', '#444444'];
        const handleColorDelete = vi.fn();
        const handleColorChange = vi.fn();

        render(
            <GenericThemesAccordion
                handleColorChange={handleColorChange}
                visualization="sankey"
                handleColorDelete={handleColorDelete}
                handleColorAdd={vi.fn()}
            />
        );

        const inputs = screen.getAllByPlaceholderText('#FFFFFF');
        fireEvent.blur(inputs[1] as HTMLElement);
        expect(handleColorChange).not.toHaveBeenCalled();

        const actionButtons = screen.getAllByRole('button').filter((button) => button.className.includes('hover:bg-gray-100'));
        fireEvent.click(actionButtons[1] as HTMLElement);
        expect(handleColorDelete).toHaveBeenCalledWith('sankey', 'light');

        themeState.sankey.light.colors = ['#112233', '#445566', '#778899'];
        themeState.sankey.dark.colors = ['#112233', '#445566', '#778899'];
    });

    it('handles missing visualization palette gracefully', () => {
        themeState['custom'] = { light: {} as any, dark: {} as any } as any;

        render(
            <GenericThemesAccordion
                handleColorChange={vi.fn()}
                visualization="custom"
                handleColorDelete={vi.fn()}
                handleColorAdd={vi.fn()}
            />
        );

        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByText('Dark')).toBeInTheDocument();
        delete themeState['custom'];
    });
});
