import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator
} from '@/components/ui/command';
import userEvent from '@testing-library/user-event';
import { a } from 'vitest/dist/chunks/suite.d.FvehnV49.js';

const TestWrapper = () => {
  const [open, setOpen] = React.useState(true);
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading='Group 1'>
          <CommandItem> Item 1</CommandItem>
          <CommandItem> Item 2
            <CommandShortcut>+2</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading='Group 2'>
          <CommandItem disabled> Item 3</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
describe('CommandDialog', () => {
  
  it('renders CommandDialog with input and items', () => {

    render(<TestWrapper />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  })
  it('renders items and groups', () => {
    render(<TestWrapper />);
    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('Group 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  })
  it('renders CommandEmpty when no results', async () => {
    render(<TestWrapper />);
    const input = screen.getByPlaceholderText('Search...');
    await userEvent.type(input, 'nonexistent');
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });
  it('select an item', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);
    const item = screen.getByText('Item 1') 
    await user.click(item);
    expect(item).toBeInTheDocument()

  });
});
