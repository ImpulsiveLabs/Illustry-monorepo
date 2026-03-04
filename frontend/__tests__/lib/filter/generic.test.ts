import { describe, expect, it } from 'vitest';
import {
    evaluateCondition,
    getMatchingIndices,
    parseCondition,
    validateExpressions
} from '@/lib/filter/generic';

describe('lib/filter/generic', () => {
    it('parses numeric and date conditions', () => {
        expect(parseCondition('>= 10')).toEqual(['>=', '10']);
        expect(parseCondition("<= '2024-01-01'", true)).toEqual(['<=', '2024-01-01']);
    });

    it('throws for invalid conditions', () => {
        expect(() => parseCondition('invalid')).toThrow('Invalid condition');
    });

    it('evaluates all supported operators', () => {
        expect(evaluateCondition(11, '>10')).toBe(true);
        expect(evaluateCondition(9, '<10')).toBe(true);
        expect(evaluateCondition(10, '>=10')).toBe(true);
        expect(evaluateCondition(10, '<=10')).toBe(true);
        expect(evaluateCondition(9, '!=10')).toBe(true);
        expect(evaluateCondition('10', '=10')).toBe(true);
        expect(evaluateCondition('2024-01-02', ">='2024-01-01'", true)).toBe(true);
    });

    it('returns matching indices', () => {
        expect(getMatchingIndices(['a', 'b', 'c'], ['c', 'a'])).toEqual([0, 2]);
    });

    it('validates expressions and throws on invalid word/construction', () => {
        expect(validateExpressions(['values>=10', 'headers=[a]'], ['values', 'headers'])).toEqual([
            'values>=10',
            'headers=[a]'
        ]);
        expect(() => validateExpressions(['foo>=10'], ['values'])).toThrow("Word 'foo' not found");
        expect(() => validateExpressions(['values'], ['values'])).toThrow('Construction not found');
    });
});
