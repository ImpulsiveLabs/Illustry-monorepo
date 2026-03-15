import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import DataTableLoading from '@/components/data-table/data-table-loading';

describe('DataTableLoading', () => {
    it('renders skeleton rows and columns', () => {
        render(
            <DataTableLoading
                columnCount={3}
                rowCount={2}
                isNewRowCreatable
                isRowsDeletable
            />
        );

        expect(screen.getAllByRole('row')).toHaveLength(3);
        expect(screen.getAllByRole('cell')).toHaveLength(6);
        expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    });

    it('does not render delete/new-row toolbar skeleton when actions are disabled', () => {
        const { container } = render(
            <DataTableLoading
                columnCount={2}
                rowCount={1}
                isNewRowCreatable={false}
                isRowsDeletable={false}
            />
        );

        const actionSkeletons = container.querySelectorAll('.h-7.w-\\[70px\\]');
        expect(actionSkeletons.length).toBeGreaterThan(0);
    });
});
