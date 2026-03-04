import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import DataTableFacetedFilter from '@/components/data-table/data-table-faceted-filter';

describe('DataTableFacetedFilter', () => {
    it('renders selected count badge and updates filter values', async () => {
        const user = userEvent.setup();
        const setFilterValue = vi.fn();

        const column = {
            getFilterValue: () => ['a', 'b', 'c'],
            setFilterValue
        } as any;

        render(
            <DataTableFacetedFilter
                column={column}
                title="Status"
                options={[
                    { label: 'A', value: 'a' },
                    { label: 'B', value: 'b' },
                    { label: 'C', value: 'c' },
                    { label: 'D', value: 'd' }
                ]}
            />
        );

        expect(screen.getByText('3 selected')).toBeInTheDocument();

        const trigger = screen.getByRole('button', { name: 'Filter rows' });
        await user.click(trigger);
        await user.click(screen.getByRole('option', { name: 'D' }));

        expect(setFilterValue).toHaveBeenCalledWith(['a', 'b', 'c', 'd']);
    });
});
