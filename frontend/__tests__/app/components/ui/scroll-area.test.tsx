import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

 describe('ScrollArea', () => {
  it('renders vertical scrollbar when content overflows', () => {
    render(
      <ScrollArea orientation="vertical" style={{ height: '100px', width: '100px' }}>
        <div data-testid="scroll-content" style={{ height: '1000px' }}>
          Scrollable Content
        </div>
      </ScrollArea>
    );

    const scrollbar = screen.getByTestId('scrollbar');
    expect(scrollbar).toBeInTheDocument();
  });
   it('renders horizontal scrollbar when content overflows', () => {
    render(
      <ScrollArea orientation="horizontal" style={{ height: '100px', width: '100px' }}>
        <div data-testid="scroll-content" style={{ height: '1000px' }}>
          Scrollable Content
        </div>
      </ScrollArea>
    );

    const scrollbar = screen.getByTestId('scrollbar');
    expect(scrollbar).toBeInTheDocument();
  });
});
