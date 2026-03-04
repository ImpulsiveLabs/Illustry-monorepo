import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MainNav from '@/components/layouts/main-nav';

vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>
}));

let activeProjectValue = false;

vi.mock('@/components/providers/active-project-provider', () => ({
    useActiveProject: () => activeProjectValue
}));

vi.mock('@/components/layouts/theme-toggle', () => ({
    default: () => <button type="button">Theme</button>
}));

vi.mock('@/components/icons', () => ({
    default: {
        spinner: (props: any) => <svg data-testid="spinner" {...props} />,
        logo: (props: any) => <svg data-testid="logo" {...props} />
    }
}));

describe('MainNav', () => {
    beforeEach(() => {
        activeProjectValue = false;
    });

    it('renders items and disables project-dependent links when no active project', async () => {
        render(
            <MainNav
                items={[
                    { title: 'projects', href: '/projects', clickableNoActiveProject: false },
                    { title: 'home', href: '/', clickableNoActiveProject: true }
                ]}
            />
        );

        const projectsLink = await screen.findByRole('link', { name: 'projects' });
        const homeLink = screen.getByRole('link', { name: 'home' });

        expect(projectsLink).toHaveAttribute('aria-disabled', 'true');
        expect(projectsLink).toHaveClass('pointer-events-none');
        expect(homeLink).toHaveAttribute('aria-disabled', 'false');
        expect(screen.getByRole('button', { name: 'Theme' })).toBeInTheDocument();
    });

    it('keeps links enabled when active project exists', async () => {
        activeProjectValue = true;
        render(
            <MainNav
                items={[
                    { title: 'projects', href: '/projects', clickableNoActiveProject: false }
                ]}
            />
        );

        const projectsLink = await screen.findByRole('link', { name: 'projects' });
        expect(projectsLink).toHaveAttribute('aria-disabled', 'false');
        expect(projectsLink).not.toHaveClass('pointer-events-none');
    });
});
