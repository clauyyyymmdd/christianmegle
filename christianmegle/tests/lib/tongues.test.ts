import { describe, it, expect } from 'vitest';
import { scrambleToTongues } from '../../src/lib/tongues';

describe('scrambleToTongues', () => {
  it('preserves spaces (word boundaries)', () => {
    const result = scrambleToTongues('hello world');
    expect(result.split(' ')).toHaveLength(2);
    expect(result[5]).toBe(' ');
  });

  it('preserves punctuation', () => {
    const result = scrambleToTongues('Hello, world! How are you?');
    expect(result).toContain(',');
    expect(result).toContain('!');
    expect(result).toContain('?');
  });

  it('preserves digits', () => {
    const result = scrambleToTongues('test 123 end');
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('3');
  });

  it('maintains the same length as input', () => {
    const input = 'I see that you are burdened by sin';
    const result = scrambleToTongues(input);
    expect(result.length).toBe(input.length);
  });

  it('replaces alphabetic characters with non-ASCII script characters', () => {
    const result = scrambleToTongues('hello');
    // No ASCII letters should remain
    for (const ch of result) {
      expect(ch.charCodeAt(0)).toBeGreaterThan(127);
    }
  });

  it('returns empty string for empty input', () => {
    expect(scrambleToTongues('')).toBe('');
  });

  it('produces different output on different calls (randomized)', () => {
    const input = 'The quick brown fox jumps over the lazy dog';
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(scrambleToTongues(input));
    }
    // Statistically should produce multiple unique results
    expect(results.size).toBeGreaterThan(1);
  });

  it('handles punctuation-only input unchanged', () => {
    expect(scrambleToTongues('...')).toBe('...');
    expect(scrambleToTongues('!?!')).toBe('!?!');
  });
});
