import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/(intro)/page'; 
import { describe, it, expect, vi } from 'vitest';

// Mock the Typewriter component
vi.mock('@/components/animatedText/Typewriter', () => ({
  __esModule: true,
  default: (props: any) => {
    // Just render a simple placeholder with props.words joined
    return <div data-testid="typewriter-mock">{props.words?.join(', ')}</div>;
  }
}));
vi.mock('@/components/shells/shell', () => ({
  __esModule: true,
  Shell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell-mock">{children}</div>
  )
}));
describe('Home', () => {
  it('renders and shows mocked Typewriter and other elements', () => {
    render(<Home />);

    // Check the mocked Typewriter is rendered with correct words
    expect(screen.getByTestId('typewriter-mock')).toHaveTextContent('Understand, Learn about, Visualize');

    // Check for the static text after Typewriter
    expect(screen.getByText(/your data!/i)).toBeInTheDocument();

    // Check the documentation link exists and has correct href
    const docLink = screen.getByRole('link', { name: /documentation/i });
    expect(docLink).toBeInTheDocument();
    expect(docLink).toHaveAttribute('href', 'https://impulsivelabs.github.io/Illustry-monorepo/');

    // Check the balance text
    expect(screen.getByText(/take a look at the official documentation/i)).toBeInTheDocument();
  });
});
