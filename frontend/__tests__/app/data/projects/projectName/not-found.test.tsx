import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectNotFound from '@/app/(data)/projects/[projectName]/not-found';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/shells/shell', () => ({
  Shell: ({ children, variant }: { children: React.ReactNode; variant: string }) => (
    <div data-testid="shell" data-variant={variant}>
      {children}
    </div>
  )
}));

vi.mock('@/components/ui/error-card', () => ({
  __esModule: true,
  default: ({ title, description, retryLink, retryLinkText }: any) => (
    <div data-testid="error-card">
      <h1>{title}</h1>
      <p>{description}</p>
      <a href={retryLink}>{retryLinkText}</a>
    </div>
  )
}));

describe('ProjectNotFound', () => {
  it('renders a Shell and an ErrorCard with correct content', () => {
    render(<ProjectNotFound />);

    // Shell is rendered with correct variant
    const shell = screen.getByTestId('shell');
    expect(shell).toHaveAttribute('data-variant', 'centered');

    // ErrorCard is rendered with correct props
    const errorCard = screen.getByTestId('error-card');
    expect(errorCard).toBeInTheDocument();
    expect(errorCard).toHaveTextContent('Project not found');
    expect(errorCard).toHaveTextContent('The Project may have expired');
    expect(errorCard).toHaveTextContent('Go to Projects');
    expect(screen.getByRole('link', { name: 'Go to Projects' })).toHaveAttribute(
      'href',
      '/projects'
    );
  });
});
