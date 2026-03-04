import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Switch from '@/components/ui/switch';

describe('Switch', () => {
    it('renders a switch', () => {
        render(<Switch aria-label="toggle" />);
        expect(screen.getByRole('switch', { name: 'toggle' })).toBeInTheDocument();
    });

    it('calls onCheckedChange when clicked', async () => {
        const onCheckedChange = vi.fn();
        const user = userEvent.setup();

        render(<Switch aria-label="toggle" onCheckedChange={onCheckedChange} />);
        await user.click(screen.getByRole('switch', { name: 'toggle' }));

        expect(onCheckedChange).toHaveBeenCalledTimes(1);
        expect(onCheckedChange).toHaveBeenCalledWith(true);
    });
});
