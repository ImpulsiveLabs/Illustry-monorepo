import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import MobileNav from '@/components/layouts/mobile-nav';

vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>
}));

let activeProjectValue = false;

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard'
}));

vi.mock('@/components/providers/active-project-provider', () => ({
    useActiveProject: () => activeProjectValue
}));

vi.mock('@/components/layouts/theme-toggle', () => ({
    default: () => <button type="button">Theme</button>
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
});
