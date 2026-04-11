import { describe, it, expect } from 'vitest';
import { exorcismText, FLOATING_PHRASES } from '../../src/lib/exorcism-language';

describe('exorcismText', () => {
  it('returns original text when exorcism is not active', () => {
    expect(exorcismText('Send', false)).toBe('Send');
    expect(exorcismText('CONFESSION CHAT', false)).toBe('CONFESSION CHAT');
  });

  it('returns Latin text when exorcism is active and key exists', () => {
    expect(exorcismText('Send', true)).toBe('Mitte');
    expect(exorcismText('CONFESSION CHAT', true)).toBe('CONFESSIO COLLOQVIVM');
    expect(exorcismText('Priest', true)).toBe('Sacerdos');
    expect(exorcismText('Stranger', true)).toBe('Advena');
    expect(exorcismText('Holy Water', true)).toBe('Aqua Benedicta');
  });

  it('falls back to original text when no Latin mapping exists', () => {
    expect(exorcismText('unmapped text', true)).toBe('unmapped text');
    expect(exorcismText('', true)).toBe('');
  });

  it('maps all toolbar button labels', () => {
    const toolbarLabels = [
      'Send Verse', 'Stained Glass', 'Incense', 'Candlelight',
      'Holy Water', 'Ring Bells', 'Take Eucharist',
      'Impose Silence', 'Lift Silence', 'Excommunicate',
      'Begin Exorcism', 'End Exorcism', 'Speak in Tongues',
    ];
    for (const label of toolbarLabels) {
      const result = exorcismText(label, true);
      expect(result).not.toBe(label);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});

describe('FLOATING_PHRASES', () => {
  it('contains multiple phrases', () => {
    expect(FLOATING_PHRASES.length).toBeGreaterThanOrEqual(10);
  });

  it('every phrase is a non-empty string', () => {
    for (const phrase of FLOATING_PHRASES) {
      expect(typeof phrase).toBe('string');
      expect(phrase.length).toBeGreaterThan(0);
    }
  });
});
