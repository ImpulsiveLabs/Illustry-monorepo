import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import MobileNav from '@/components/layouts/mobile-nav';

vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>
}));

let activeProjectValue = false;
let desktopViewport = false;

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard'
}));

vi.mock('@/components/providers/active-project-provider', () => ({
    useActiveProject: () => activeProjectValue
}));

vi.mock('@/components/layouts/theme-toggle', () => ({
    default: () => <button type="button">Theme</button>
}));

vi.mock('@/components/layouts/locale-switcher', () => ({
    default: () => <button type="button">Locale</button>
}));

vi.mock('@/components/icons', () => ({
    default: {
        spinner: (props: any) => <svg data-testid="spinner" {...props} />,
        menu: (props: any) => <svg data-testid="menu" {...props} />,
        logo: (props: any) => <svg data-testid="logo" {...props} />
    }
}));

describe('MobileNav', () => {
    beforeEach(() => {
        activeProjectValue = false;
        desktopViewport = false;

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                media: query,
                get matches() {
                    return desktopViewport;
                },
                onchange: null,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                addListener: vi.fn(),
                removeListener: vi.fn(),
                dispatchEvent: vi.fn()
            }))
        });
    });

    it('opens menu and disables project-dependent item without active project', async () => {
        const user = userEvent.setup();

        render(
            <MobileNav
                items={[
                    { title: 'Projects', href: '/projects', clickableNoActiveProject: false },
                    { title: 'About', href: '/about', clickableNoActiveProject: true }
                ]}
            />
        );

        await user.click(await screen.findByRole('button', { name: 'Toggle Menu' }));

        const projectsLink = screen.getByRole('link', { name: 'Projects' });
        const aboutLink = screen.getByRole('link', { name: 'About' });

        expect(projectsLink).toHaveClass('pointer-events-none');
        expect(aboutLink).not.toHaveClass('pointer-events-none');
        expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument();
    });

    it('keeps links clickable with active project and handles link clicks', async () => {
        const user = userEvent.setup();
        activeProjectValue = true;

        render(
            <MobileNav
                items={[
                    { title: 'Projects', href: '/projects', clickableNoActiveProject: false },
                    { title: 'About', href: '/about', clickableNoActiveProject: true }
                ]}
            />
        );

        await user.click(await screen.findByRole('button', { name: 'Toggle Menu' }));

        const projectsLink = screen.getByRole('link', { name: 'Projects' });
        expect(projectsLink).not.toHaveClass('pointer-events-none');

        await user.click(screen.getByRole('link', { name: 'Home' }));
        await user.click(await screen.findByRole('button', { name: 'Toggle Menu' }));
        await user.click(screen.getByRole('link', { name: 'Projects' }));
    });

    it('falls back to root path when mobile item href is missing', async () => {
        const user = userEvent.setup();
        activeProjectValue = true;

        render(
            <MobileNav
                items={[
                    { title: 'Fallback', clickableNoActiveProject: true }
                ]}
            />
        );

        await user.click(await screen.findByRole('button', { name: 'Toggle Menu' }));
        expect(screen.getByRole('link', { name: 'Fallback' })).toHaveAttribute('href', '/');
    });

    it('auto closes the drawer when viewport returns to desktop', async () => {
        const user = userEvent.setup();
        activeProjectValue = true;

        render(
            <MobileNav
                items={[
                    { title: 'Projects', href: '/projects', clickableNoActiveProject: false }
                ]}
            />
        );

        await user.click(await screen.findByRole('button', { name: 'Toggle Menu' }));
        expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();

        desktopViewport = true;
        window.dispatchEvent(new Event('resize'));

        await waitFor(() => {
            expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument();
        });
    });
});
