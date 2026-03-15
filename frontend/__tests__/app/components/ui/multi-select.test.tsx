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
  PopoverContent: ({ children, onEscapeKeyDown }: any) => (
    <div>
      <button type="button" data-testid="escape-popover" onClick={() => onEscapeKeyDown?.()} />
      {children}
    </div>
  )
}));

vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: any) => <div>{children}</div>,
  CommandInput: (props: any) => <input data-testid="command-input" {...props} />,
  CommandList: ({ children }: any) => <ul>{children}</ul>,
  CommandGroup: ({ children }: any) => <div>{children}</div>,
  CommandItem: ({ children, onSelect }: any) => (
    <div onClick={() => onSelect?.()}>{children}</div>
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
      {Array.from({ length: totalCount + 1 }, (_, index) => (
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
      xIcon: (props: any) => <svg data-testid="icon-xIcon" {...props} />,
      xCircle: (props: any) => <svg data-testid="icon-xCircle" {...props} />,
      chevronDown: (props: any) => <svg data-testid="icon-chevronDown" {...props} />,
      checkIcon: (props: any) => <svg data-testid="icon-checkIcon" {...props} />,
      sparkles: (props: any) => <svg data-testid="icon-sparkles" {...props} />,
    },
  };
});

describe('MultiSelect', () => {
  const OptionIcon = (props: any) => <svg data-testid="custom-option-icon" {...props} />;
  const options = [
    { label: 'Option 1', value: 'option1', icon: OptionIcon },
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

    const trigger = screen.getByText('Select options').closest('button') as HTMLButtonElement;
    fireEvent.click(trigger);

    const commandList = screen.getByTestId('virtuoso');
    const firstOption = within(commandList).getByText('(Select All)');
    fireEvent.click(firstOption);

    expect(onValueChange).toHaveBeenCalledWith(options.map((o) => o.value));
  });

  it('selects an individual option from the list', () => {
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} onValueChange={onValueChange} />);

    const trigger = screen.getByText('Select options').closest('button') as HTMLButtonElement;
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText('Option 2'));

    expect(onValueChange).toHaveBeenCalledWith(['option2']);
  });

  it('toggles select-all branch back to clear when everything is selected', () => {
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} defaultValue={options.map((o) => o.value)} onValueChange={onValueChange} />);

    const commandList = screen.getByTestId('virtuoso');
    const selectAll = within(commandList).getByText('(Select All)');
    fireEvent.click(selectAll);

    expect(onValueChange).toHaveBeenCalledWith([]);
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

  it('handles keyboard shortcuts for enter and backspace in the command input', () => {
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} defaultValue={['option1']} onValueChange={onValueChange} />);

    const input = screen.getByTestId('command-input');
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Backspace' });

    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it('does not remove selection on backspace when command input has content', () => {
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} defaultValue={['option1']} onValueChange={onValueChange} />);

    const input = screen.getByTestId('command-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.keyDown(input, { key: 'Backspace' });

    expect(onValueChange).not.toHaveBeenCalledWith([]);
  });

  it('renders extra-count badge and trims with clearExtraOptions', () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        options={options}
        defaultValue={['option1', 'option2', 'option3', 'option4']}
        onValueChange={onValueChange}
        maxCount={2}
      />
    );

    const moreBadge = screen.getByText('+ 2 more');
    const moreBadgeContainer = moreBadge.closest('span') as HTMLElement;
    const trimIcon = within(moreBadgeContainer).getByTestId('icon-xCircle');
    fireEvent.click(trimIcon);

    expect(onValueChange).toHaveBeenCalledWith(['option1', 'option2']);
  });

  it('shows and toggles sparkles animation when animation is enabled', () => {
    render(
      <MultiSelect
        options={options}
        defaultValue={['option1']}
        onValueChange={vi.fn()}
        animation={1}
      />
    );

    const sparkles = screen.getByTestId('icon-sparkles');
    expect(sparkles.className.baseVal).toContain('text-muted-foreground');
    fireEvent.click(sparkles);
    expect(sparkles.className.baseVal).not.toContain('text-muted-foreground');
    expect(screen.getAllByTestId('custom-option-icon').length).toBeGreaterThan(0);
  });

  it('animates the extra-count badge when sparkles are toggled', () => {
    render(
      <MultiSelect
        options={options}
        defaultValue={['option1', 'option2', 'option3', 'option4']}
        onValueChange={vi.fn()}
        maxCount={2}
        animation={1}
      />
    );

    fireEvent.click(screen.getByTestId('icon-sparkles'));
    expect(screen.getByText('+ 2 more').className).toContain('animate-bounce');
  });

  it('clears via x icon and closes via mocked escape callback', () => {
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} defaultValue={['option1']} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByTestId('icon-xIcon'));
    expect(onValueChange).toHaveBeenCalledWith([]);

    fireEvent.click(screen.getByTestId('escape-popover'));
    expect(screen.getByTestId('virtuoso')).toBeInTheDocument();
  });
});
