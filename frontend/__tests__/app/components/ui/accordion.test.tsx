import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent
} from '@/components/ui/accordion';

describe('Accordion', () => {
    it('renders Accordion with multiple items', () => {
        render(
            <Accordion type="single">
                <AccordionItem value="1">
                    <AccordionTrigger>Item 1</AccordionTrigger>
                    <AccordionContent>Content 1</AccordionContent>
                </AccordionItem>
                <AccordionItem value="2">
                    <AccordionTrigger>Item 2</AccordionTrigger>
                    <AccordionContent>Content 2</AccordionContent>
                </AccordionItem>
            </Accordion>
        );

        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Item 1'));
        expect(screen.queryByText('Content 1')).toBeInTheDocument();
        expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Item 2'));
        expect(screen.queryByText('Content 2')).toBeInTheDocument();
        expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });

});
