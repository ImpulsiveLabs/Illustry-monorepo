import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import DataTableColumnHeader from '@/components/data-table/data-table-column-header';

describe('DataTableColumnHeader', () => {
    it('renders plain title when sorting is disabled', () => {
        const column = {
            getCanSort: () => false
        } as any;

        render(<DataTableColumnHeader column={column} title="Name" />);
        expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('sorts and hides column via menu actions', async () => {
        const user = userEvent.setup();
        const toggleSorting = vi.fn();
        const toggleVisibility = vi.fn();

        const column = {
            getCanSort: () => true,
            getIsSorted: () => false,
            toggleSorting,
            toggleVisibility
        } as any;

        render(<DataTableColumnHeader column={column} title="Name" />);

        await user.click(screen.getByRole('button', { name: 'Not sorted. Click to sort ascending.' }));
        await user.click(screen.getByRole('menuitem', { name: 'Sort ascending' }));
        await user.click(screen.getByRole('button', { name: 'Not sorted. Click to sort ascending.' }));
        await user.click(screen.getByRole('menuitem', { name: 'Sort descending' }));
        await user.click(screen.getByRole('button', { name: 'Not sorted. Click to sort ascending.' }));
        await user.click(screen.getByRole('menuitem', { name: 'Hide column' }));

        expect(toggleSorting).toHaveBeenCalledWith(false);
        expect(toggleSorting).toHaveBeenCalledWith(true);
        expect(toggleVisibility).toHaveBeenCalledWith(false);
    });

    it('renders sorted aria labels for asc and desc states', () => {
        const descColumn = {
            getCanSort: () => true,
            getIsSorted: () => 'desc',
            toggleSorting: vi.fn(),
            toggleVisibility: vi.fn()
        } as any;

        const ascColumn = {
            getCanSort: () => true,
            getIsSorted: () => 'asc',
            toggleSorting: vi.fn(),
            toggleVisibility: vi.fn()
        } as any;

        const { rerender } = render(<DataTableColumnHeader column={descColumn} title="Name" />);
        expect(screen.getByRole('button', { name: 'Sorted descending. Click to sort ascending.' })).toBeInTheDocument();

        rerender(<DataTableColumnHeader column={ascColumn} title="Name" />);
        expect(screen.getByRole('button', { name: 'Sorted ascending. Click to sort descending.' })).toBeInTheDocument();
    });
});
