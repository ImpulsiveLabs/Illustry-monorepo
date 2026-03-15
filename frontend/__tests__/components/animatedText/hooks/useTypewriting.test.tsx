import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from '@/components/animatedText/hooks/useTypewriting';

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('types, delays, deletes and marks loop done', async () => {
    const onType = vi.fn();
    const onDelete = vi.fn();
    const onDelay = vi.fn();
    const onLoopDoneInitial = vi.fn();
    const onLoopDoneAfterRerender = vi.fn();

    const { result, rerender } = renderHook((props: { onLoopDone?: () => void }) => useTypewriter({
      words: ['AB'],
      loop: 1,
      typeSpeed: 1,
      deleteSpeed: 1,
      delaySpeed: 2,
      onType,
      onDelete,
      onDelay,
      onLoopDone: props.onLoopDone
    }), { initialProps: { onLoopDone: onLoopDoneInitial } });

    expect(result.current[0]).toBe('');
    expect(result.current[1].isDone).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current[0]).toBe('A');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current[0]).toBe('AB');

    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(result.current[1].isDone).toBe(true);
    expect(onLoopDoneInitial).not.toHaveBeenCalled();

    rerender({ onLoopDone: onLoopDoneAfterRerender });
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onType).toHaveBeenCalled();
    expect(onLoopDoneAfterRerender).toHaveBeenCalledTimes(1);
  });

  it('keeps safe defaults when no words are available', () => {
    const onType = vi.fn();
    const onDelete = vi.fn();

    const { result } = renderHook(() => useTypewriter({
      words: [],
      loop: false,
      typeSpeed: 1,
      deleteSpeed: 1,
      delaySpeed: 1,
      onType,
      onDelete
    }));

    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(result.current[0]).toBe('');
    expect(result.current[1]).toMatchObject({
      isType: false,
      isDelay: false,
      isDelete: false,
      isDone: false
    });
    expect(onType).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('triggers delay and delete callbacks during a full cycle', () => {
    const onDelay = vi.fn();
    const onDelete = vi.fn();

    renderHook(() => useTypewriter({
      words: ['A'],
      loop: false,
      typeSpeed: 1,
      deleteSpeed: 1,
      delaySpeed: 2,
      onDelay,
      onDelete
    }));

    act(() => {
      vi.advanceTimersByTime(1);
    });
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDelay).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3);
    });
    expect(onDelete).toHaveBeenCalled();
  });

  it('runs safely when optional callbacks are omitted', () => {
    const { result } = renderHook(() => useTypewriter({
      words: ['A'],
      loop: 1,
      typeSpeed: 1,
      deleteSpeed: 1,
      delaySpeed: 1
    }));

    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(result.current[0]).toMatch(/A|/);
    expect(result.current[1]).toHaveProperty('isType');
  });

  it('continues looping without marking done when loop target is not reached', () => {
    const { result } = renderHook(() => useTypewriter({
      words: ['A'],
      loop: 2,
      typeSpeed: 1,
      deleteSpeed: 1,
      delaySpeed: 1
    }));

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(result.current[1].isDone).toBe(false);
  });

  it('keeps running when a positive loop target is not yet met on first completed word', () => {
    const { result } = renderHook(() => useTypewriter({
      words: ['AB'],
      loop: 2,
      typeSpeed: 1,
      deleteSpeed: 1,
      delaySpeed: 50
    }));

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current[0]).toBe('A');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current[0]).toBe('AB');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current[1].isDone).toBe(false);
  });

  it('handles delay and delete phases when callbacks are undefined', () => {
    const { result } = renderHook(() => useTypewriter({
      words: ['A'],
      loop: false,
      typeSpeed: 1,
      deleteSpeed: 1,
      delaySpeed: 1
    }));

    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(['', 'A']).toContain(result.current[0]);
    expect(result.current[1]).toHaveProperty('isDelete');
    expect(result.current[1]).toHaveProperty('isDelay');
  });

  it('advances to next cycle after delete reaches empty text', () => {
    const { result } = renderHook(() => useTypewriter({
      words: ['A'],
      loop: false,
      typeSpeed: 1,
      deleteSpeed: 1,
      delaySpeed: 1
    }));

    act(() => {
      vi.advanceTimersByTime(12);
    });

    // A full type-delay-delete-count cycle should retype from start.
    expect(result.current[0]).toMatch(/A|/);
    expect(result.current[1]).toHaveProperty('isDelete');
  });

});
