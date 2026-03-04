import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import DataTableViewOptions from '@/components/data-table/data-table-view-options';

describe('DataTableViewOptions', () => {
    it('shows hidable columns and toggles visibility', async () => {
        const user = userEvent.setup();
        const toggleVisibility = vi.fn();

        const table = {
            getAllColumns: () => [
                {
                    id: 'name',
                    accessorFn: () => 'a',
                    getCanHide: () => true,
                    getIsVisible: () => true,
                    toggleVisibility
                },
                {
                    id: 'meta',
                    accessorFn: undefined,
                    getCanHide: () => true,
                    getIsVisible: () => true,
                    toggleVisibility: vi.fn()
                }
            ]
        } as any;

        render(<DataTableViewOptions table={table} />);

        await user.click(screen.getByRole('button', { name: 'Toggle columns' }));
        await user.click(screen.getByRole('menuitemcheckbox', { name: 'name' }));

        expect(screen.queryByRole('menuitemcheckbox', { name: 'meta' })).not.toBeInTheDocument();
        expect(toggleVisibility).toHaveBeenCalledWith(false);
    });
});
