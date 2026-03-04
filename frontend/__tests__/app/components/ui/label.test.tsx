import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Label from '@/components/ui/label';

describe('Label', () => {
  it('renders Label', () => {
    render(<Label >Test Label</Label>);

    const label = screen.getByText('Test Label');
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('LABEL');
  });
});
