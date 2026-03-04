import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
describe('Popover', () => {
  it('renders Popover with trigger and content', async () => {
    const user = userEvent.setup();
    
    render(
      <Popover>
        <PopoverTrigger>Open Popover</PopoverTrigger>
        <PopoverContent>
          <p>This is the popover content.</p>
        </PopoverContent>
      </Popover>
    );

    // Check that the trigger renders
    expect(screen.getByText('Open Popover')).toBeInTheDocument();

    // Content should not be visible initially
    expect(screen.queryByText('This is the popover content.')).toBeNull();

    // Simulate clicking the trigger
    await user.click(screen.getByText('Open Popover'));

    // The content should now appear
    expect(screen.getByText('This is the popover content.')).toBeInTheDocument();
  });
});

