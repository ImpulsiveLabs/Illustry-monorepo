import { describe, expect, it, vi, beforeEach } from 'vitest';

const { toastError } = vi.hoisted(() => ({
    toastError: vi.fn()
}));

vi.mock('sonner', () => ({
    toast: { error: toastError }
}));

vi.mock('next/font/google', () => ({
    Inter: vi.fn(() => ({ className: 'inter-class', variable: '--font-sans' })),
    JetBrains_Mono: vi.fn(() => ({ className: 'mono-class', variable: '--font-mono' }))
}));

import makeRequest from '@/lib/request';
import { catchError, cloneDeep, cn, formatDate } from '@/lib/utils';
import { fontMono, fontSans } from '@/lib/fonts';
import * as z from 'zod';

describe('lib request/utils/fonts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('makeRequest resolves json for ok and non-ok responses', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: 1 }) })
            .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ ok: 0 }) });
        vi.stubGlobal('fetch', fetchMock as any);

        await expect(makeRequest('/a', ['x'])).resolves.toEqual({ ok: 1 });
        await expect(makeRequest('/b', ['y'])).resolves.toEqual({ ok: 0 });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('cn merges classes and formatDate formats utc date', () => {
        expect(cn('a', false && 'b', 'c')).toContain('a');
        expect(formatDate('2024-01-02T00:00:00.000Z')).toBe('2024/1/2');
    });

    it('catchError handles zod, standard and unknown errors', () => {
        const schema = z.object({ n: z.number() });
        const parsed = schema.safeParse({ n: 'bad' });
        expect(parsed.success).toBe(false);

        catchError((parsed as any).error);
        catchError(new Error('boom'));
        catchError('unknown');

        expect(toastError).toHaveBeenCalledTimes(3);
    });

    it('cloneDeep returns detached copy', () => {
        const source = { a: { b: 1 } };
        const cloned = cloneDeep(source);
        cloned.a.b = 2;
        expect(source.a.b).toBe(1);
    });

    it('fonts export configured objects', () => {
        expect(fontSans).toMatchObject({ variable: '--font-sans' });
        expect(fontMono).toMatchObject({ variable: '--font-mono' });
    });
});
