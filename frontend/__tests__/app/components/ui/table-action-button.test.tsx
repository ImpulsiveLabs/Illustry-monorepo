import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ActionButton from '@/components/ui/table-action-button';

vi.mock('next/link', () => ({
    default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>
}));

describe('ActionButton', () => {
    it('renders delete button and runs delete flow', async () => {
        const user = userEvent.setup();
        const deleteRowsAction = vi.fn();
        const toggleAllPageRowsSelected = vi.fn();
        const startTransition = vi.fn((cb: () => void) => cb());

        const table = {
            getSelectedRowModel: () => ({ rows: [{ id: '1' }] }),
            toggleAllPageRowsSelected
        } as any;

        render(
            <ActionButton
                table={table}
                isPending={false}
                deleteRowsAction={deleteRowsAction}
                startTransition={startTransition}
            />
        );

        await user.click(screen.getByRole('button', { name: 'Delete selected rows' }));

        expect(startTransition).toHaveBeenCalledTimes(1);
        expect(toggleAllPageRowsSelected).toHaveBeenCalledWith(false);
        expect(deleteRowsAction).toHaveBeenCalledTimes(1);
    });

    it('renders new link when no rows are selected', () => {
        const table = {
            getSelectedRowModel: () => ({ rows: [] }),
            toggleAllPageRowsSelected: vi.fn()
        } as any;

        render(
            <ActionButton
                table={table}
                isPending={false}
                newRowLink="/projects/new"
                startTransition={vi.fn()}
            />
        );

        const link = screen.getByRole('link', { name: 'Create new row' });
        expect(link).toHaveAttribute('href', '/projects/new');
        expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders nothing when no actions are available', () => {
        const table = {
            getSelectedRowModel: () => ({ rows: [] }),
            toggleAllPageRowsSelected: vi.fn()
        } as any;

        const { container } = render(
            <ActionButton
                table={table}
                isPending={false}
                startTransition={vi.fn()}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });
});
