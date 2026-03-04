import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDebounce from '@/lib/hooks/use-debounce';

describe('useDebounce hook', () => {
    it('debounces value with default delay and updates after timer', () => {
        vi.useFakeTimers();

        const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
            initialProps: { value: 'a' }
        });

        expect(result.current).toBe('a');
        rerender({ value: 'b' });
        expect(result.current).toBe('a');

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe('b');
        vi.useRealTimers();
    });

    it('uses custom delay', () => {
        vi.useFakeTimers();

        const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
            initialProps: { value: 1 }
        });

        rerender({ value: 2 });
        act(() => {
            vi.advanceTimersByTime(99);
        });
        expect(result.current).toBe(1);

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current).toBe(2);

        vi.useRealTimers();
    });
});
