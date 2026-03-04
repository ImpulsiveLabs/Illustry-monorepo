import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent
} from '@/components/ui/tabs';

describe('Tabs', () => {
    it('switches visible tab content', async () => {
        const user = userEvent.setup();

        render(
            <Tabs defaultValue="a">
                <TabsList>
                    <TabsTrigger value="a">Tab A</TabsTrigger>
                    <TabsTrigger value="b">Tab B</TabsTrigger>
                </TabsList>
                <TabsContent value="a">Content A</TabsContent>
                <TabsContent value="b">Content B</TabsContent>
            </Tabs>
        );

        expect(screen.getByText('Content A')).toBeVisible();
        expect(screen.queryByText('Content B')).not.toBeInTheDocument();

        await user.click(screen.getByRole('tab', { name: 'Tab B' }));

        expect(screen.getByText('Content B')).toBeVisible();
    });
});
