import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption
} from '@/components/ui/table';

describe('Table', () => {
    it('renders full table structure', () => {
        render(
            <Table>
                <TableCaption>Demo caption</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Column</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>Value</TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell>Footer</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        );

        expect(screen.getByText('Demo caption')).toBeInTheDocument();
        expect(screen.getByText('Column')).toBeInTheDocument();
        expect(screen.getByText('Value')).toBeInTheDocument();
        expect(screen.getByText('Footer')).toBeInTheDocument();
    });
});
