import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
    SelectSeparator,
    SelectLabel,
    SelectGroup
} from '@/components/ui/select';

describe('Custom Select', () => {
    it('renders the select and selects an option', async () => {
        const user = userEvent.setup();

        render(
            <Select defaultValue="apple">
                <SelectTrigger data-testid="select-trigger">
                    <SelectValue placeholder="Select a fruit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel><SelectItem value="apple">Apple</SelectItem></SelectLabel>
                        <SelectSeparator />
                        <SelectItem value="banana">Banana</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        );

        const trigger = screen.getByTestId('select-trigger');
        expect(trigger).toBeVisible();

        await userEvent.click(trigger);
        const item = (await screen.findAllByText('Apple')).at(-1)!;
        item.style.pointerEvents = 'auto';
        expect(item).toBeVisible();
        await userEvent.click(item);

        expect(trigger).toHaveTextContent('Apple');
    });
});
