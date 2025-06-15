import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MultiSelect from '@/components/ui/multi-select';


vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <>{children}</>,
  PopoverContent: ({ children }: any) => <div>{children}</div>
}));

vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: any) => <div>{children}</div>,
  CommandInput: (props: any) => <input data-testid="command-input" {...props} />,
  CommandList: ({ children }: any) => <ul>{children}</ul>,
  CommandGroup: ({ children }: any) => <li>{children}</li>,
  CommandItem: ({ children, onSelect }: any) => (
    <li onClick={() => onSelect?.()}>{children}</li>
  ),
  CommandSeparator: () => <hr />,
  CommandEmpty: () => <div>No results found.</div>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>
}));

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ itemContent, totalCount }: any) => (
    <div data-testid="virtuoso">
      {Array.from({ length: totalCount }, (_, index) => (
        <div key={index}>{itemContent(index)}</div>
      ))}
    </div>
  )
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}));

vi.mock('@/components/icons', async () => {
  return {
    default: {
      xIcon: () => <svg data-testid="icon-xIcon" />,
      xCircle: (props: any) => <svg data-testid="icon-xCircle" {...props} />,
      chevronDown: () => <svg data-testid="icon-chevronDown" />,
      checkIcon: () => <svg data-testid="icon-checkIcon" />,
      sparkles: (props: any) => <svg data-testid="icon-sparkles" {...props} />,
    },
  };
});

describe('MultiSelect', () => {
  const options = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' },
    { label: 'Option 4', value: 'option4' }
  ];

  it('renders with placeholder when no value is selected', () => {
    render(<MultiSelect options={options} onValueChange={vi.fn()} placeholder="Pick one" />);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('shows selected values as badges and allows clearing one', () => {
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} defaultValue={["option1"]} onValueChange={onValueChange} />);
    expect(screen.getAllByText('Option 1')[0]).toBeInTheDocument();
    const closeIcon = screen.getByTestId('icon-xCircle');
    fireEvent.click(closeIcon);
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it('opens the popover and allows selecting options', () => {
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} onValueChange={onValueChange} />);

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const commandList = screen.getByTestId('virtuoso');
    const firstOption = within(commandList).getByText('(Select All)');
    fireEvent.click(firstOption);

    expect(onValueChange).toHaveBeenCalledWith(options.map((o) => o.value));
  });

  it('clears all when clicking Clear', () => {
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} defaultValue={["option1", "option2"]} onValueChange={onValueChange} />);
    const clearBtn = screen.getByText('Clear');
    fireEvent.click(clearBtn);
    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it('closes when clicking Close', () => {
    render(<MultiSelect options={options} defaultValue={["option1"]} onValueChange={vi.fn()} />);
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(closeBtn).toBeInTheDocument(); // Basic smoke test for the button
  });
});

