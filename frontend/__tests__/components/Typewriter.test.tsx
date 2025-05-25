import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Typewriter from '@/components/animatedText/Typewriter';

// Mock Cursor directly
vi.mock('@/components/animatedText/Cursor', () => ({
    default: ({ cursorStyle }: { cursorStyle: string }) => (
        <div data-testid="mock-cursor">{cursorStyle}</div>
    )
}));

// Mock the useTypewriter hook
vi.mock('@/components/animatedText/hooks/useTypewriting', async () => {
    const actual = await vi.importActual<
        typeof import('@/components/animatedText/hooks/useTypewriting')
    >('@/components/animatedText/hooks/useTypewriting');

    return {
        ...actual,
        useTypewriter: vi.fn()
    };
});

import { useTypewriter } from '@/components/animatedText/hooks/useTypewriting';

describe('Typewriter component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the typed text returned by the hook', () => {
        (useTypewriter as ReturnType<typeof vi.fn>).mockReturnValue(['Hello, world!']);

        render(<Typewriter words={['test']} />);

        expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });

    it('does not render cursor if cursor is false (default)', () => {
        (useTypewriter as ReturnType<typeof vi.fn>).mockReturnValue(['Text without cursor']);

        render(<Typewriter words={['no cursor']} />);

        expect(screen.queryByTestId('mock-cursor')).not.toBeInTheDocument();
    });

    it('renders the cursor if cursor is true', () => {
        (useTypewriter as ReturnType<typeof vi.fn>).mockReturnValue(['Text with cursor']);

        render(
            <Typewriter
                words={['cursor']}
                cursor
                cursorStyle="_"
                cursorColor="red"
                cursorBlinking={false}
            />
        );

        expect(screen.getByText('Text with cursor')).toBeInTheDocument();
        expect(screen.getByTestId('mock-cursor')).toHaveTextContent('_');
    });
});
