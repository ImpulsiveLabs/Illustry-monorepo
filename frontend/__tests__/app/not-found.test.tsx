import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';
import React from 'react';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';

describe('NotFound Page', () => {
  it('renders heading and message', () => {
    render(<MemoryRouterProvider><NotFound /></MemoryRouterProvider>);

    expect(screen.getByText('Oops! Not Found')).toBeInTheDocument();
    expect(
      screen.getByText("Sorry, we couldn't find the requested resource.")
    ).toBeInTheDocument();
  });

  it('renders a link to the main page', () => {
    render(<NotFound />, { wrapper: MemoryRouterProvider });

    const link = screen.getByRole('link', { name: /go to main page/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
