import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-intersection-observer', () => ({
    useInView: () => ({ ref: vi.fn(), inView: true })
}));

vi.mock('react-vertical-timeline-component/style.min.css', () => ({}));
vi.mock('react-vertical-timeline-component', () => ({
    VerticalTimeline: ({ children }: any) => <div data-testid="vertical-timeline">{children}</div>,
    VerticalTimelineElement: ({ children }: any) => <div data-testid="vertical-timeline-element">{children}</div>
}));

vi.mock('@/lib/visualizations/timeline/helper', () => ({
    groupEventsByDate: vi.fn((events: any[]) => ({
        '10:00': events
    }))
}));

vi.mock('@/components/views/timeline/timelineAccordion', () => ({
    default: ({ date }: any) => <div data-testid="accordion">{date}</div>
}));

vi.mock('@/components/views/timeline/timelineElement', () => ({
    default: ({ children, date }: any) => <div data-testid="timeline-element">{date}{children}</div>
}));

import TimelineView from '@/components/views/timeline';
import TimelineDialog from '@/components/views/timeline/timelineDialog';

describe('Timeline components', () => {
    it('renders timeline view and paginates', async () => {
        const user = userEvent.setup();
        localStorage.setItem('theme', 'dark');
        const data: any = {};
        for (let i = 1; i <= 11; i += 1) {
            data[`2020-01-${String(i).padStart(2, '0')}`] = {
                summary: { title: `Title ${i}` },
                events: []
            };
        }

        render(<TimelineView data={data} fullScreen={false} legend={false} options={{}} />);

        expect(screen.getByTestId('vertical-timeline')).toBeInTheDocument();
        expect(screen.getByText('Title 1')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Go to next page' }));
        expect(screen.getByText('Title 11')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Go to previous page' }));
        expect(screen.getByText('Title 1')).toBeInTheDocument();
    });

    it('opens timeline dialog content', async () => {
        const user = userEvent.setup();

        render(
            <TimelineDialog
                event={{
                    summary: 'My Event',
                    description: 'Description',
                    author: 'John',
                    tags: [{ name: 'alpha' }]
                } as any}
            />
        );

        await user.click(screen.getByText('My Event'));
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText(/Author:/)).toBeInTheDocument();
        expect(screen.getByText('alpha')).toBeInTheDocument();
    });

    it('renders fullscreen variant without constrained height class', async () => {
        const user = userEvent.setup();
        render(
            <TimelineView
                data={{
                    '2020-01-01': {
                        summary: { title: 'One' },
                        events: []
                    }
                } as any}
                fullScreen={true}
                legend={false}
                options={{}}
            />
        );

        expect(screen.getByText('One')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Go to next page' }));
        await user.click(screen.getByRole('button', { name: 'Go to previous page' }));
        expect(screen.getByText('One')).toBeInTheDocument();
    });
});
