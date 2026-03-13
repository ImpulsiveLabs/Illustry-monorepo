import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DefaultThemesAccordion from '@/components/ui/theme/default-themes';
import GenericThemesAccordion from '@/components/ui/theme/generic-themes';

vi.mock('@/components/providers/theme-provider', () => ({
    useThemeColors: () => ({
        sankey: {
            light: { colors: ['#112233', '#445566', '#778899'] },
            dark: { colors: ['#112233', '#445566', '#778899'] }
        }
    })
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

        expect(handleApplyTheme).toHaveBeenCalledWith('primary');
        expect(handleApplyTheme).toHaveBeenCalledWith('secondary');
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
        fireEvent.click(screen.getByRole('button', { name: /Close color picker/i }));
    });
});
