import { render, screen } from '@testing-library/react';
import Playground, { metadata } from '@/app/playground/page';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock the PlaygroundShell component
vi.mock('@/components/shells/playground-shell', () => ({
  __esModule: true,
  default: () => <div data-testid="playground-shell">Mocked PlaygroundShell</div>
}));

describe('Playground Page', () => {
  it('renders the PlaygroundShell component', () => {
    render(<Playground />);
    expect(screen.getByTestId('playground-shell')).toBeInTheDocument();
    expect(screen.getByText('Mocked PlaygroundShell')).toBeInTheDocument();
  });

  it('exports correct metadata', () => {
    expect(metadata).toEqual({
      title: 'Playground',
      description: 'Play with data'
    });
  });
});
