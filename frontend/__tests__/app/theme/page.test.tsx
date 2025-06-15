import { render, screen } from '@testing-library/react';
import Theme, { metadata } from '@/app/theme/page';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock the ThemeShell component
vi.mock('@/components/shells/theme-shell', () => ({
  __esModule: true,
  default: () => <div data-testid="Theme-shell">Mocked ThemeShell</div>
}));

describe('Theme Page', () => {
  it('renders the ThemeShell component', () => {
    render(<Theme />);
    expect(screen.getByTestId('Theme-shell')).toBeInTheDocument();
    expect(screen.getByText('Mocked ThemeShell')).toBeInTheDocument();
  });

  it('exports correct metadata', () => {
    expect(metadata).toEqual({
      title: 'Theme',
      description: 'Manage your Theme'
    });
  });
});
