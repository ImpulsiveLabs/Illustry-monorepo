import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Cursor from '@/components/animatedText/Cursor';

describe('Cursor component', () => {
  it('renders with default props', () => {
    render(<Cursor />);
    const cursor = screen.getByText('|');
    expect(cursor).toBeInTheDocument();
    expect(cursor).toHaveClass('blinkingCursor');
    expect(cursor).toHaveClass('blinking');
    expect(cursor).toHaveStyle({ color: 'inherit' });
  });

  it('does not apply blinking class when cursorBlinking is false', () => {
    render(<Cursor cursorBlinking={false} />);
    const cursor = screen.getByText('|');
    expect(cursor).toBeInTheDocument();
    expect(cursor).toHaveClass('blinkingCursor');
    expect(cursor).not.toHaveClass('blinking');
  });

  it('renders with custom cursorStyle', () => {
    render(<Cursor cursorStyle={<span>_</span>} />);
    const cursor = screen.getByText('_');
    expect(cursor).toBeInTheDocument();
  });

});
