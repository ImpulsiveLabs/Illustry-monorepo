import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogClose
} from '@/components/ui/dialog';

describe('Dialog', () => {
    it('opens dialog, renders content, and close on button click', () => {
        render(
            <Dialog>
                <DialogTrigger> Open Dialog</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                        <DialogDescription>Dialog Description</DialogDescription>
                    </DialogHeader>
                    <div>Dialog body goes here</div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <button>Submit</button>
                        </DialogClose>
                        <DialogClose asChild>
                            <button>Cancel</button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Open Dialog'));
        expect(screen.getByText('Dialog Title')).toBeInTheDocument();
        expect(screen.getByText('Dialog Description')).toBeInTheDocument();
        expect(screen.getByText('Dialog body goes here')).toBeInTheDocument();
        expect(screen.getByText('Submit')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Submit'));
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
    });

    it('applies top positioning style variant', () => {
        render(
            <Dialog>
                <DialogTrigger>Top Dialog</DialogTrigger>
                <DialogContent position="top">
                    <DialogTitle>Top Title</DialogTitle>
                </DialogContent>
            </Dialog>
        );

        fireEvent.click(screen.getByText('Top Dialog'));
        const title = screen.getByText('Top Title');
        const content = title.closest('[role="dialog"]');
        expect(content?.className).toContain('top-44');
    });
});
