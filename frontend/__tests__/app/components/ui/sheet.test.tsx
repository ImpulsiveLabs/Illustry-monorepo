import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet';

describe('Sheet', () => {
    it('renders open sheet content and close button', () => {
        render(
            <Sheet open>
                <SheetContent side="left">
                    <SheetHeader>
                        <SheetTitle>Sheet title</SheetTitle>
                        <SheetDescription>Sheet description</SheetDescription>
                    </SheetHeader>
                    <SheetFooter>Footer area</SheetFooter>
                </SheetContent>
            </Sheet>
        );

        expect(screen.getByText('Sheet title')).toBeInTheDocument();
        expect(screen.getByText('Sheet description')).toBeInTheDocument();
        expect(screen.getByText('Footer area')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument();
    });
});
