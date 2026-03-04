import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    Collapsible, CollapsibleTrigger, CollapsibleContent
} from '@/components/ui/collapsable';

describe('Collapsible', () => {
    it('toggles content when trigger is clicked', async () => {
        render(
            <Collapsible>
                <CollapsibleTrigger>Toggle Content</CollapsibleTrigger>
                <CollapsibleContent>
                    This is the collapsible content.
                </CollapsibleContent>
            </Collapsible>
        )
        await userEvent.click(screen.getByText('Toggle Content'));
        expect(screen.getByText('This is the collapsible content.')).toBeVisible();
    })
})