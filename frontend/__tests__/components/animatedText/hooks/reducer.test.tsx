import { describe, it, expect } from 'vitest';
import { reducer } from '@/components/animatedText/hooks/reducer';
import type { State, Action } from '@/components/animatedText/hooks/reducer';

describe('reducer', () => {
    const initialState: State = {
        speed: 50,
        text: '',
        count: 0,
    };

    it('handles TYPE action correctly', () => {
        const action: Action = {
            type: 'TYPE',
            payload: 'Hello',
            speed: 100,
        };
        const state: State = { ...initialState, text: 'Hel' };
        const result = reducer(state, action);
        expect(result.text).toBe('Hell');
        expect(result.speed).toBe(100);
    });

    it('handles DELETE action correctly', () => {
        const action: Action = {
            type: 'DELETE',
            payload: 'Hello',
            speed: 75,
        };
        const state: State = { ...initialState, text: 'Hell' };
        const result = reducer(state, action);
        expect(result.text).toBe('Hel');
        expect(result.speed).toBe(75);
    });

    it('handles DELAY action correctly', () => {
        const action: Action = {
            type: 'DELAY',
            payload: 200,
        };
        const result = reducer(initialState, action);
        expect(result.speed).toBe(200);
        expect(result.text).toBe('');
    });

    it('handles COUNT action correctly', () => {
        const result = reducer(initialState, { type: 'COUNT' });
        expect(result.count).toBe(1);
    });

    it('returns the current state for unknown action types', () => {
        const result = reducer(initialState, { type: 'UNKNOWN_ACTION' } as any);
        expect(result).toEqual(initialState);
    });
});
