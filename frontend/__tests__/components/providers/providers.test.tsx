import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    ActiveProjectProvider,
    useActiveProject,
    useActiveProjectDispatch
} from '@/components/providers/active-project-provider';
import {
    ThemeProvider,
    ThemeColorsProvider,
    useThemeColors,
    useThemeColorsDispach
} from '@/components/providers/theme-provider';
import {
    LocaleProvider,
    useLocale
} from '@/components/providers/locale-provider';

const { nextThemeProviderSpy } = vi.hoisted(() => ({
    nextThemeProviderSpy: vi.fn(({ children }: { children: React.ReactNode }) => (
        <div data-testid="next-theme-provider">{children}</div>
    ))
}));

vi.mock('next-themes', () => ({
    ThemeProvider: nextThemeProviderSpy
}));

const ActiveProjectConsumer = () => {
    const activeProject = useActiveProject();
    const dispatch = useActiveProjectDispatch();
    return (
        <>
            <span data-testid="active-project-state">{String(activeProject)}</span>
            <button onClick={() => dispatch({ type: 'SET_ACTIVE_PROJECT', payload: !activeProject })}>
                toggle
            </button>
        </>
    );
};

const ActiveProjectInvalidDispatchConsumer = () => {
    const activeProject = useActiveProject();
    const dispatch = useActiveProjectDispatch();
    return (
        <>
            <span data-testid="active-project-invalid-state">{String(activeProject)}</span>
            <button onClick={() => dispatch({ type: 'UNKNOWN' as any, payload: false })}>
                invalid-dispatch
            </button>
        </>
    );
};

const ActiveProjectDispatchOutsideProvider = () => {
    const dispatch = useActiveProjectDispatch();
    return <span data-testid="dispatch-outside">{String(Boolean(dispatch))}</span>;
};

const ThemeConsumer = ({
    actionType = 'apply',
    modifiedData = {
        calendar: {
            dark: { colors: ['#000000'] }
        }
    }
}: { actionType?: string; modifiedData?: any }) => {
    const colors = useThemeColors();
    const dispatch = useThemeColorsDispach();

    return (
        <>
            <span data-testid="calendar-color">{colors.calendar.dark.colors[0]}</span>
            <button
                onClick={() => dispatch?.({
                    type: actionType as 'apply',
                    modifiedData
                })}
            >
                update-colors
            </button>
        </>
    );
};

const ThemeDispatchOutsideProvider = () => {
    const dispatch = useThemeColorsDispach();
    return <span data-testid="dispatch-defined">{String(Boolean(dispatch))}</span>;
};

const LocaleConsumer = () => {
    const { locale, setLocale, t } = useLocale();
    return (
        <>
            <span data-testid="locale">{locale}</span>
            <span data-testid="message">{t('common.home')}</span>
            <span data-testid="missing-message">{t('missing.translation.key')}</span>
            <button onClick={() => setLocale('ar')}>set-ar</button>
        </>
    );
};

const clearCookie = (name: string) => {
    document.cookie = `${name}=; Path=/; Max-Age=0`;
};

describe('providers', () => {
    beforeEach(() => {
        localStorage.clear();
        clearCookie('illustry-locale');
        clearCookie('illustry-country');
        document.documentElement.lang = '';
        document.documentElement.dir = '';
    });

    it('throws when active project hooks are used outside provider', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
            expect(() => render(<ActiveProjectConsumer />)).toThrow('useActiveProject must be used within an ActiveProjectProvider');
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    it('throws when active project dispatch hook is used outside provider', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        try {
            expect(() => render(<ActiveProjectDispatchOutsideProvider />))
                .toThrow('useActiveProjectDispatch must be used within an ActiveProjectProvider');
        } finally {
            consoleErrorSpy.mockRestore();
        }
    });

    it('hydrates active project state from localStorage and persists updates', async () => {
        const user = userEvent.setup();
        localStorage.setItem('activeProject', JSON.stringify(true));

        render(
            <ActiveProjectProvider>
                <ActiveProjectConsumer />
            </ActiveProjectProvider>
        );

        expect(screen.getByTestId('active-project-state')).toHaveTextContent('true');

        await user.click(screen.getByRole('button', { name: 'toggle' }));

        await waitFor(() => {
            expect(screen.getByTestId('active-project-state')).toHaveTextContent('false');
            expect(localStorage.getItem('activeProject')).toBe('false');
        });
    });

    it('wraps children with next-themes provider and forwards props', () => {
        render(
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
                <div>theme child</div>
            </ThemeProvider>
        );

        expect(nextThemeProviderSpy).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('next-theme-provider')).toHaveTextContent('theme child');
    });

    it('hydrates and updates theme colors in storage', async () => {
        const user = userEvent.setup();
        localStorage.setItem(
            'colorTheme',
            JSON.stringify({
                calendar: {
                    dark: { colors: ['#123456'] },
                    light: { colors: ['#654321'] }
                }
            })
        );

        render(
            <ThemeColorsProvider>
                <ThemeConsumer />
            </ThemeColorsProvider>
        );

        expect(screen.getByTestId('calendar-color')).toHaveTextContent('#123456');

        await user.click(screen.getByRole('button', { name: 'update-colors' }));

        await waitFor(() => {
            expect(screen.getByTestId('calendar-color')).toHaveTextContent('#000000');
            const stored = localStorage.getItem('colorTheme') || '';
            expect(stored).toContain('#000000');
        });
    });

    it('handles non-apply dispatch by returning cloned state', async () => {
        const user = userEvent.setup();

        render(
            <ThemeColorsProvider>
                <ThemeConsumer actionType="noop" />
            </ThemeColorsProvider>
        );

        const before = screen.getByTestId('calendar-color').textContent;
        await user.click(screen.getByRole('button', { name: 'update-colors' }));
        expect(screen.getByTestId('calendar-color').textContent).toBe(before);
    });

    it('returns undefined dispatch outside ThemeColorsProvider', () => {
        render(<ThemeDispatchOutsideProvider />);
        expect(screen.getByTestId('dispatch-defined')).toHaveTextContent('false');
    });

    it('keeps state unchanged for unknown active-project reducer actions', async () => {
        const user = userEvent.setup();

        render(
            <ActiveProjectProvider>
                <ActiveProjectInvalidDispatchConsumer />
            </ActiveProjectProvider>
        );

        expect(screen.getByTestId('active-project-invalid-state')).toHaveTextContent('false');
        await user.click(screen.getByRole('button', { name: 'invalid-dispatch' }));
        expect(screen.getByTestId('active-project-invalid-state')).toHaveTextContent('false');
    });

    it('handles absent localStorage and ignores unknown theme keys during apply', async () => {
        const user = userEvent.setup();
        const originalLocalStorage = window.localStorage;

        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            value: null
        });

        render(
            <ActiveProjectProvider>
                <ActiveProjectConsumer />
            </ActiveProjectProvider>
        );
        expect(screen.getByTestId('active-project-state')).toHaveTextContent('false');

        render(
            <ThemeColorsProvider>
                <ThemeConsumer modifiedData={{ unknownKey: { dark: { colors: ['#fff'] } } }} />
            </ThemeColorsProvider>
        );
        const beforeWithoutStorage = screen.getByTestId('calendar-color').textContent;
        await user.click(screen.getByRole('button', { name: 'update-colors' }));
        expect(screen.getByTestId('calendar-color').textContent).toBe(beforeWithoutStorage);

        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            value: originalLocalStorage
        });
    });

    it('uses default locale context outside the locale provider', () => {
        render(<LocaleConsumer />);

        expect(screen.getByTestId('locale')).toHaveTextContent('en');
        expect(screen.getByTestId('message')).toHaveTextContent('Home');
        expect(screen.getByTestId('missing-message')).toHaveTextContent('missing.translation.key');
    });

    it('hydrates locale from localStorage and persists rtl locale changes', async () => {
        const user = userEvent.setup();
        localStorage.setItem('illustry-locale', 'ro');

        render(
            <LocaleProvider>
                <LocaleConsumer />
            </LocaleProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('locale')).toHaveTextContent('ro');
            expect(document.documentElement.lang).toBe('ro');
            expect(document.documentElement.dir).toBe('ltr');
        });

        await user.click(screen.getByRole('button', { name: 'set-ar' }));

        await waitFor(() => {
            expect(screen.getByTestId('locale')).toHaveTextContent('ar');
            expect(localStorage.getItem('illustry-locale')).toBe('ar');
            expect(document.documentElement.lang).toBe('ar');
            expect(document.documentElement.dir).toBe('rtl');
        });
    });

    it('resolves locale from cookie, country and browser language fallbacks', async () => {
        document.cookie = 'illustry-locale=fr; Path=/';
        const { unmount } = render(
            <LocaleProvider>
                <LocaleConsumer />
            </LocaleProvider>
        );
        await waitFor(() => expect(screen.getByTestId('locale')).toHaveTextContent('fr'));
        unmount();

        localStorage.clear();
        clearCookie('illustry-locale');
        document.cookie = 'illustry-country=JP; Path=/';
        const second = render(
            <LocaleProvider>
                <LocaleConsumer />
            </LocaleProvider>
        );
        await waitFor(() => expect(screen.getByTestId('locale')).toHaveTextContent('ja'));
        second.unmount();

        localStorage.clear();
        clearCookie('illustry-locale');
        clearCookie('illustry-country');
        const originalLanguages = window.navigator.languages;
        Object.defineProperty(window.navigator, 'languages', {
            configurable: true,
            value: ['ko-KR', 'en-US']
        });
        render(
            <LocaleProvider>
                <LocaleConsumer />
            </LocaleProvider>
        );
        await waitFor(() => expect(screen.getByTestId('locale')).toHaveTextContent('ko'));
        Object.defineProperty(window.navigator, 'languages', {
            configurable: true,
            value: originalLanguages
        });
    });

    it('falls back to English when browser languages are unsupported', async () => {
        const originalLanguages = window.navigator.languages;
        localStorage.clear();
        clearCookie('illustry-locale');
        clearCookie('illustry-country');
        Object.defineProperty(window.navigator, 'languages', {
            configurable: true,
            value: ['zz-ZZ']
        });

        render(
            <LocaleProvider>
                <LocaleConsumer />
            </LocaleProvider>
        );

        await waitFor(() => expect(screen.getByTestId('locale')).toHaveTextContent('en'));
        Object.defineProperty(window.navigator, 'languages', {
            configurable: true,
            value: originalLanguages
        });
    });

});
