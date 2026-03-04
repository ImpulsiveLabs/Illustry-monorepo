import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Textarea from '@/components/ui/textarea';

describe('Textarea', () => {
    it('renders textarea with placeholder', () => {
        render(<Textarea placeholder="Write here" />);
        expect(screen.getByPlaceholderText('Write here')).toBeInTheDocument();
    });

    it('supports disabled state', () => {
        render(<Textarea disabled aria-label="comment" />);
        expect(screen.getByLabelText('comment')).toBeDisabled();
    });
});
