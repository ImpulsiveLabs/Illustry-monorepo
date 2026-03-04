import { describe, test, expect } from 'vitest';

import { computePropertiesForToolTip, computeColor, computeWords, calculateMeanValue } from '../../../../src/lib/visualizations/word-cloud/helper';

import { VisualizationTypes } from '@illustry/types';

describe('computePropertiesForToolTip', () => {
  test('handles object properties with value', () => {
    const properties = { name: 'John', age: 30 };
    const value = '100';
    const result = computePropertiesForToolTip(properties, value);
    expect(result).toBe(
      '<div style="font-weight: bold">name:John</div>' +
      '<div style="font-weight: bold">age:30</div>' +
      '<div style="font-weight: bold">value:100</div>'
    );
  });

  test('handles object properties without value', () => {
    const properties = { name: 'John', age: 30 };
    const result = computePropertiesForToolTip(properties);
    expect(result).toBe(
      '<div style="font-weight: bold">name:John</div>' +
      '<div style="font-weight: bold">age:30</div>'
    );
  });

  test('handles empty object properties', () => {
    const properties = {};
    const result = computePropertiesForToolTip(properties);
    expect(result).toBe('');
  });

  test('handles empty object with value', () => {
    const properties = {};
    const value = '100';
    const result = computePropertiesForToolTip(properties, value);
    expect(result).toBe('<div style="font-weight: bold">value:100</div>');
  });

  test('handles string properties with value', () => {
    const properties = 'Tooltip name';
    const value = '50';
    const result = computePropertiesForToolTip(properties, value);
    expect(result).toBe('Tooltip name<div style="font-weight: bold">value:50</div>');
  });

  test('handles string properties without value', () => {
    const properties = 'Tooltip name';
    const result = computePropertiesForToolTip(properties);
    expect(result).toBe('Tooltip name');
  });

  test('handles empty string properties', () => {
    const properties = '';
    const result = computePropertiesForToolTip(properties);
    expect(result).toBe('');
  });

  test('handles null properties with value', () => {
    const properties = null;
    const value = '42';
    const result = computePropertiesForToolTip(properties as any, value);
    expect(result).toBe('<div style="font-weight: bold">value:42</div>');
  });

  test('handles null properties without value', () => {
    const properties = null;
    const result = computePropertiesForToolTip(properties as any);
    expect(result).toBe('');
  });

  test('handles undefined properties with value', () => {
    const properties = undefined;
    const value = '99';
    const result = computePropertiesForToolTip(properties as any, value);
    expect(result).toBe('<div style="font-weight: bold">value:99</div>');
  });

  test('handles undefined properties without value', () => {
    const properties = undefined;
    const result = computePropertiesForToolTip(properties as any);
    expect(result).toBe('');
  });

  test('handles invalid properties type (number)', () => {
    const properties = 123 as any;
    const result = computePropertiesForToolTip(properties);
    expect(result).toBe('');
  });
});

describe('computeWords', () => {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
  const words: VisualizationTypes.WordType[] = [
    { name: 'word1', value: 10 },
    { name: 'word2', value: 20 },
    { name: 'word3', value: 30 },
    { name: 'word4', value: 40 },
  ];

  test('computes words with valid values and colors', () => {
    const result = computeWords(words, colors);
    expect(result).toEqual([
      { name: 'word1', value: 10, textStyle: { fontWeight: 'bold', color: colors[1] } },
      { name: 'word2', value: 20, textStyle: { fontWeight: 'bold', color: colors[3] } },
      { name: 'word3', value: 30, textStyle: { fontWeight: 'bold', color: colors[4] } },
      { name: 'word4', value: 40, textStyle: { fontWeight: 'bold', color: colors[4] } },
    ]);
  });

  test('handles empty words array', () => {
    const result = computeWords([], colors);
    expect(result).toEqual([]);
  });

  test('handles zero values in words', () => {
    const zeroWords: VisualizationTypes.WordType[] = [
      { name: 'word1', value: 0 },
      { name: 'word2', value: 0 },
    ];
    const result = computeWords(zeroWords, colors);
    expect(result).toEqual([
      { name: 'word1', value: 0, textStyle: { fontWeight: 'bold', color: '' } },
      { name: 'word2', value: 0, textStyle: { fontWeight: 'bold', color: '' } },
    ]);
  });

  test('handles negative values in words', () => {
    const negWords: VisualizationTypes.WordType[] = [
      { name: 'word1', value: -10 },
      { name: 'word2', value: -20 },
    ];
    const result = computeWords(negWords, colors);
    expect(result).toEqual([
      { name: 'word1', value: -10, textStyle: { fontWeight: 'bold', color: '' } },
      { name: 'word2', value: -20, textStyle: { fontWeight: 'bold', color: '' } },
    ]);
  });

  test('handles empty colors array', () => {
    const result = computeWords(words, []);
    expect(result).toEqual([
      { name: 'word1', value: 10, textStyle: { fontWeight: 'bold', color: '' } },
      { name: 'word2', value: 20, textStyle: { fontWeight: 'bold', color: '' } },
      { name: 'word3', value: 30, textStyle: { fontWeight: 'bold', color: '' } },
      { name: 'word4', value: 40, textStyle: { fontWeight: 'bold', color: '' } },
    ]);
  });

  test('handles insufficient colors (less than 5)', () => {
    const shortColors = ['#FF0000', '#00FF00'];
    const result = computeWords(words, shortColors);
    expect(result).toEqual([
      { name: 'word1', value: 10, textStyle: { fontWeight: 'bold', color: shortColors[1] } },
      { name: 'word2', value: 20, textStyle: { fontWeight: 'bold', color: '' } },
      { name: 'word3', value: 30, textStyle: { fontWeight: 'bold', color: '' } },
      { name: 'word4', value: 40, textStyle: { fontWeight: 'bold', color: '' } },
    ]);
  });

  test('handles zero mean value', () => {
    const zeroWords: VisualizationTypes.WordType[] = [
      { name: 'word1', value: 0 },
      { name: 'word2', value: 0 },
    ];
    const result = computeWords(zeroWords, colors);
    expect(result).toEqual([
      { name: 'word1', value: 0, textStyle: { fontWeight: 'bold', color: '' } },
      { name: 'word2', value: 0, textStyle: { fontWeight: 'bold', color: '' } },
    ]);
  });
});

describe('calculateMeanValue', () => {
  test('computes mean of numbers', () => {
    const numbers = [10, 20, 30, 40];
    const result = calculateMeanValue(numbers);
    expect(result).toBe(25);
  });

  test('handles empty array', () => {
    const result = calculateMeanValue([]);
    expect(result).toBe(0);
  });

  test('handles single number', () => {
    const result = calculateMeanValue([42]);
    expect(result).toBe(42);
  });

  test('handles negative numbers', () => {
    const result = calculateMeanValue([-10, -20, -30]);
    expect(result).toBe(-20);
  });
});

describe('computeColor', () => {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
  const meanValue = 100;

  test('returns color for 0% < percent <= 25%', () => {
    const result = computeColor(25, meanValue, colors);
    expect(result).toBe(colors[0]);
  });

  test('returns color for 25% < percent <= 50%', () => {
    const result = computeColor(50, meanValue, colors);
    expect(result).toBe(colors[1]);
  });

  test('returns color for 50% < percent <= 75%', () => {
    const result = computeColor(75, meanValue, colors);
    expect(result).toBe(colors[2]);
  });

  test('returns color for 75% < percent <= 100%', () => {
    const result = computeColor(100, meanValue, colors);
    expect(result).toBe(colors[3]);
  });

  test('returns color for percent > 100%', () => {
    const result = computeColor(150, meanValue, colors);
    expect(result).toBe(colors[4]);
  });

  test('returns empty string for percent <= 0', () => {
    const result = computeColor(0, meanValue, colors);
    expect(result).toBe('');
  });

  test('returns empty string for negative value', () => {
    const result = computeColor(-10, meanValue, colors);
    expect(result).toBe('');
  });

  test('handles zero mean value', () => {
    const result = computeColor(10, 0, colors);
    expect(result).toBe('');
  });

  test('handles empty colors array', () => {
    const result = computeColor(50, meanValue, []);
    expect(result).toBe('');
  });
});