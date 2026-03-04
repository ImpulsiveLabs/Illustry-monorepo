import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup
} from '@/components/ui/dropdown-menu';
import userEvent from '@testing-library/user-event';

describe('Dropdownmenu', () => {
    beforeEach(() => {
        const portalRoot = document.createElement('div');
        portalRoot.setAttribute('id', 'radix-root');
        document.body.appendChild(portalRoot);
    })
    afterEach(() => {
        const portalRoot = document.getElementById('radix-root');
        if (portalRoot) {
            document.body.removeChild(portalRoot);
        }
    })
    it('opens the menu when trigger is clicked', async () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Item 1</DropdownMenuItem>
                    <DropdownMenuItem>Item 2</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
        await userEvent.click(screen.getByText('Open'));
        await waitFor(() => {
            expect(screen.getByText('Item 1')).toBeInTheDocument();
            expect(screen.getByText('Item 2')).toBeInTheDocument();
        })
    });
    it('handles DropdownMenuItem click', async () => {
        const handleClick = vi.fn();
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleClick}>Click me</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        await userEvent.click(screen.getByText('Open'));
        await userEvent.click(screen.getByText('Click me'));
        expect(handleClick).toHaveBeenCalled();
    })
    it('renders DropdownMenuCheckboxItem', async () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuCheckboxItem checked>Checkbox</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        await userEvent.click(screen.getByText('Open'));
        expect(screen.getByText('Checkbox')).toBeVisible();
    });

    it('renders DropdownMenuRadioItem', async () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuRadioGroup value="one">
                        <DropdownMenuRadioItem value="one">Radio 1</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="two">Radio 2</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        await userEvent.click(screen.getByText('Open Menu'));
        await waitFor(() => {
            expect(screen.getByText('Radio 1')).toBeInTheDocument();
            expect(screen.getByText('Radio 2')).toBeInTheDocument();
        })
    })
    it('renders and opens DropdownMenuSub', async () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>Sub Item</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        await userEvent.click(screen.getByText('Open'));
        await userEvent.hover(screen.getByText('More'));
        await waitFor(() => {
            expect(screen.getByText('Sub Item')).toBeInTheDocument();
        })
    })

    it('renders label, separator and shortcut', async () => {
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        Item 1
                        <DropdownMenuShortcut>Ctrl+1</DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );

        await userEvent.click(screen.getByText('Open'));
        expect(await screen.findByText('Options')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Ctrl+1')).toBeInTheDocument();
    })
});
