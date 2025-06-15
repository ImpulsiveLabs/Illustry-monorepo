import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Checkbox from '@/components/ui/checkbox';
import userEvent from '@testing-library/user-event';

describe('Checkbox', () => {
    it('renders Checkbox', async () => {
        const user = userEvent.setup();
       render(<Checkbox/>);
       const checkbox = screen.getByRole('checkbox');
       expect(checkbox).toBeInTheDocument();
       expect(checkbox).not.toBeChecked();
       await user.click(checkbox);
       expect(checkbox).toBeChecked();
    });

});
