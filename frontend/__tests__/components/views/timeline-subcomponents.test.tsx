import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-vertical-timeline-component/style.min.css', () => ({}));
vi.mock('react-vertical-timeline-component', () => ({
    VerticalTimelineElement: ({ children }: any) => <div data-testid="vertical-timeline-element">{children}</div>
}));

vi.mock('@/lib/visualizations/timeline/helper', () => ({
    groupEventsByDate: vi.fn(() => ({
        '10:00': [
            { summary: 'Event A', description: 'Desc A', author: 'A', tags: [] }
        ],
        '11:00': [
            { summary: 'Event B', description: 'Desc B', author: 'B', tags: [{ name: 'tag1' }] }
        ]
    }))
}));

import TimelineAccordion from '@/components/views/timeline/timelineAccordion';
import TimelineElement from '@/components/views/timeline/timelineElement';

describe('Timeline subcomponents', () => {
    it('renders timeline accordion grouped items', async () => {
        const user = userEvent.setup();

        render(
            <TimelineAccordion
                data={{
                    '2020-01-01': {
                        events: [{ summary: 'unused' }]
                    }
                } as any}
                date="2020-01-01"
            />
        );

        expect(screen.getByText('10:00')).toBeInTheDocument();
        expect(screen.getByText('11:00')).toBeInTheDocument();

        await user.click(screen.getByText('11:00'));
        await user.click(screen.getByText('Event B'));
        expect(screen.getByText('Desc B')).toBeInTheDocument();
    });

    it('renders timeline element wrapper', () => {
        render(
            <TimelineElement date="2020-01-01" isDarkTheme={false} inView>
                <span>Child content</span>
            </TimelineElement>
        );

        expect(screen.getByTestId('vertical-timeline-element')).toBeInTheDocument();
        expect(screen.getByText('Child content')).toBeInTheDocument();
    });
});
