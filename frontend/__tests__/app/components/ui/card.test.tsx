import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent
} from '@/components/ui/card';

describe('Card', () => {
    it('renders Card', () => {
        render(
            <Card data-testid='card'>
                <CardHeader data-testid='header'>
                    <CardTitle>Test Card</CardTitle>
                    <CardDescription>This is a test card.</CardDescription>
                </CardHeader>
                <CardContent data-testid='content'>
                    This is the content of the card.
                </CardContent>
                <CardFooter data-testid='footer'>
                    Footer content
                </CardFooter>
            </Card>
        );
        expect(screen.getByTestId('card')).toBeInTheDocument();
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('content')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();
        expect(screen.getByRole('heading'), { name: 'Test Card' }).toBeInTheDocument();
        expect(screen.getByText('This is a test card.')).toBeInTheDocument();
        expect(screen.getByText('This is the content of the card.')).toBeInTheDocument();
    });

});
