import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Separator from '@/components/ui/separator';

describe('Separator', () => {
  it('applies horizontal styele by default', () => {
    render(<Separator />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('w-full', 'h-[1px]');
    });
    it('applies vertical style when orientation is vertical', () => {
    render(<Separator orientation="vertical" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('h-full', 'w-[1px]');
    });
});
