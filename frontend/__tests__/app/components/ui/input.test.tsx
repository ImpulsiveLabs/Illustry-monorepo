import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Input from '@/components/ui/input';
import userEvent from '@testing-library/user-event';
import exp from 'constants';
import { wait } from '@testing-library/user-event/dist/cjs/utils/index.js';

describe('Input', () => {
    const suggestions = ["apple", "banana", "orange"];
    const handleSelect = vi.fn();

    const Wrapper = ({value = ""}: {value?: string}) => {
        const [val, setVal] = React.useState(value);
        const ref = React.useRef<HTMLInputElement>(null);

        return (
            <Input
                ref={ref}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                suggestionsConfig ={{
                    suggestions,
                    onSuggestionsSelect: handleSelect
                }}
            />
        )
    }

    const renderWithSuggestions = (value: string = "") => {
        render(<Wrapper value={value} />);
        return screen.getByRole('textbox');
    }
  it('Input with suggestions', () => {
    const input = renderWithSuggestions();
    expect(input).toBeInTheDocument();
  });
  it("updates value when typing", async () => {
    const user = userEvent.setup();
    const value = 'Jest'
    const setValue = vi.fn();

    render(<Input value={value} onChange={(e) => setValue(e.target.value)}></Input>)
    const input = screen.getByRole('textbox');

    await user.type(input, 'u');

    await waitFor(() => {
        expect(setValue).toHaveBeenCalledWith('Jestu');
    })
  })

});
