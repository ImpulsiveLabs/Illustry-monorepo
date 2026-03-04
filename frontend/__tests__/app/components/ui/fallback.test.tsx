import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Fallback from '@/components/ui/fallback';

describe('Fallback', () => {
  it('renders the spinner icon', () => {
    render(<Fallback />);

    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });
});
