import { describe, it, expect } from 'vitest';
import {
  SCRIPTURE_BY_SIN,
  SIN_LABELS,
  SIN_ICONS,
  getRandomVerse,
  getAllVerses,
} from '../../src/lib/scripture-data';
import type { SinCategory } from '../../src/lib/types';

const ALL_SINS: SinCategory[] = ['pride', 'greed', 'lust', 'envy', 'gluttony', 'wrath', 'sloth'];

describe('SCRIPTURE_BY_SIN', () => {
  it('has entries for all 7 deadly sins', () => {
    expect(Object.keys(SCRIPTURE_BY_SIN).sort()).toEqual([...ALL_SINS].sort());
  });

  it('each sin has at least one verse', () => {
    for (const sin of ALL_SINS) {
      expect(SCRIPTURE_BY_SIN[sin].length).toBeGreaterThan(0);
    }
  });

  it('every verse has required fields', () => {
    for (const sin of ALL_SINS) {
      for (const verse of SCRIPTURE_BY_SIN[sin]) {
        expect(verse.reference).toBeTruthy();
        expect(verse.text).toBeTruthy();
        expect(verse.category).toBe(sin);
      }
    }
  });

  it('verse categories match their parent sin key', () => {
    for (const sin of ALL_SINS) {
      for (const verse of SCRIPTURE_BY_SIN[sin]) {
        expect(verse.category).toBe(sin);
      }
    }
  });
});

describe('SIN_LABELS', () => {
  it('has a label for every sin', () => {
    for (const sin of ALL_SINS) {
      expect(SIN_LABELS[sin]).toBeTruthy();
      expect(typeof SIN_LABELS[sin]).toBe('string');
    }
  });
});

describe('SIN_ICONS', () => {
  it('has an icon for every sin', () => {
    for (const sin of ALL_SINS) {
      expect(SIN_ICONS[sin]).toBeTruthy();
    }
  });
});

describe('getRandomVerse', () => {
  it('returns a verse from the specified category', () => {
    for (const sin of ALL_SINS) {
      const verse = getRandomVerse(sin);
      expect(verse.category).toBe(sin);
      expect(verse.reference).toBeTruthy();
      expect(verse.text).toBeTruthy();
    }
  });

  it('returns a verse from any category when no category specified', () => {
    const verse = getRandomVerse();
    expect(verse.reference).toBeTruthy();
    expect(verse.text).toBeTruthy();
    expect(ALL_SINS).toContain(verse.category);
  });

  it('returns a valid ScriptureVerse shape', () => {
    const verse = getRandomVerse('pride');
    expect(verse).toHaveProperty('reference');
    expect(verse).toHaveProperty('text');
    expect(verse).toHaveProperty('category');
  });
});

describe('getAllVerses', () => {
  it('returns a flat array of all verses', () => {
    const all = getAllVerses();
    const expectedCount = ALL_SINS.reduce(
      (sum, sin) => sum + SCRIPTURE_BY_SIN[sin].length,
      0,
    );
    expect(all).toHaveLength(expectedCount);
  });

  it('every returned verse has required fields', () => {
    for (const verse of getAllVerses()) {
      expect(verse.reference).toBeTruthy();
      expect(verse.text).toBeTruthy();
      expect(ALL_SINS).toContain(verse.category);
    }
  });
});
