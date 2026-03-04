import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ThemeToggle from '@/components/layouts/theme-toggle';

const refresh = vi.fn();
const setTheme = vi.fn();
let themeValue = 'light';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh })
}));

vi.mock('next-themes', () => ({
    useTheme: () => ({
        setTheme,
        theme: themeValue
    })
}));

vi.mock('@/components/icons', () => ({
    default: {
        sun: (props: any) => <svg data-testid="icon-sun" {...props} />,
        moon: (props: any) => <svg data-testid="icon-moon" {...props} />
    }
}));

describe('ThemeToggle', () => {
    beforeEach(() => {
        refresh.mockReset();
        setTheme.mockReset();
        themeValue = 'light';
    });

    it('toggles theme and refreshes router on click', async () => {
        const user = userEvent.setup();
        render(<ThemeToggle />);

        await user.click(screen.getByRole('button', { name: 'Toggle theme' }));

        expect(refresh).toHaveBeenCalledTimes(1);
        expect(setTheme).toHaveBeenCalledWith('dark');
        expect(screen.getByTestId('icon-sun')).toBeInTheDocument();
        expect(screen.getByTestId('icon-moon')).toBeInTheDocument();
    });
});
