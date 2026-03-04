import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import {
    Button
} from '@/components/ui/button';


describe('Button', () => {
    it('renders Button with default props', () => {
       render(<Button>Test Button</Button>);
       const button = screen.getByRole('button', { name: 'Test Button' });
       expect(button).toBeInTheDocument();
    });
     it('renders Button with disable state', () => {
       render(<Button disabled>Test Button</Button>);
       const button = screen.getByRole('button', { name: 'Test Button' });
       expect(button).toBeDisabled();
    });
     it('calls onClick when cliked', async() => {
        const user = userEvent.setup();
        const handleClick = vi.fn();
       render(<Button onClick={handleClick}>Test Button</Button>);
       const button = screen.getByRole('button', { name: 'Test Button' });
       await user.click(button);
       expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
