import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GenericThemesAccordion from '@/components/ui/theme/generic-themes';

vi.mock('@/components/providers/theme-provider', () => ({
  useThemeColors: () => ({
    sankey: {
      light: { colors: ['#112233'] },
      dark: { colors: ['#445566'] }
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
    <button type="button" onClick={() => changeColor('#ffffff')}>
      pick
    </button>
  )
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <>{children}</>,
  PopoverContent: ({ children }: any) => <div>{children}</div>
}));

describe('GenericThemesAccordion close button', () => {
  it('renders and clicks the close color picker button path', () => {
    render(
      <GenericThemesAccordion
        handleColorChange={vi.fn()}
        visualization="sankey"
        handleColorDelete={vi.fn()}
        handleColorAdd={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: 'Close color picker' });
    fireEvent.click(closeBtn);
    expect(closeBtn).toBeInTheDocument();
  });
});
