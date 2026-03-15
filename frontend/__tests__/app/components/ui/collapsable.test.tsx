import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent
} from '@/components/ui/collapsable';

describe('collapsable re-exports', () => {
    it('renders radix collapsable primitives through re-export', async () => {
        render(
            <Collapsible defaultOpen>
                <CollapsibleTrigger>toggle</CollapsibleTrigger>
                <CollapsibleContent>content</CollapsibleContent>
            </Collapsible>
        );

        expect(screen.getByText('toggle')).toBeInTheDocument();
        expect(screen.getByText('content')).toBeInTheDocument();
    });
});
