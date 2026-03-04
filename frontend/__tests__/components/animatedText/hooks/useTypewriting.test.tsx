import * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTypewriter } from '@/components/animatedText/hooks/useTypewriting';

vi.mock('react', async () => {
    const actualReact = await vi.importActual('react');
    return {
        ...actualReact,
        useReducer: vi.fn(),
        useCallback: vi.fn((fn) => fn),
        useEffect: vi.fn((effect) => {
            effect();
            return () => { };
        }),
    };
});


describe('useTypewriter', () => {
    beforeEach(() => {
        // Clear mocks to ensure fresh state
        vi.clearAllMocks();
        // Use fake timers for setTimeout
        vi.useFakeTimers();
    });

    afterEach(() => {
        // Clear all mocks and timers
        vi.clearAllMocks();
        vi.useRealTimers();
    });




    it('types out the first word correctly', () => {
        const dispatchMock = vi.fn();
        const initialState = { speed: 80, text: '', count: 0 };
        React.useReducer.mockReturnValue([initialState, dispatchMock]);

        const { result } = renderHook(() =>
            useTypewriter({
                words: ['Hello'],
                typeSpeed: 80,
                deleteSpeed: 50,
                delaySpeed: 1500,
            })
        );

        act(() => {
            vi.advanceTimersByTime(80);
            expect(result.current[0]).toBe('');
            expect(result.current[1]).toEqual({
                isType: false,
                isDelay: false,
                isDelete: false,
                isDone: false,
            });
        });
    });

});