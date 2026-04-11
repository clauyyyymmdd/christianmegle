import { describe, it, expect } from 'vitest';
import { isPriestAction, isChatMessage } from '../../shared/types/messages';

describe('isPriestAction', () => {
  it('returns true for all priest action types', () => {
    const priestTypes = [
      'priest-penance',
      'priest-absolution',
      'priest-scripture',
      'priest-effect',
      'priest-excommunicate',
      'priest-silence',
      'priest-inscribe',
      'priest-bells',
      'priest-exorcism',
    ];
    for (const type of priestTypes) {
      expect(isPriestAction({ type }), `expected true for ${type}`).toBe(true);
    }
  });

  it('returns false for non-priest messages', () => {
    const otherTypes = [
      'join',
      'matched',
      'waiting',
      'offer',
      'answer',
      'ice-candidate',
      'chat-message',
      'chat-typing',
      'end-session',
      'partner-left',
      'error',
    ];
    for (const type of otherTypes) {
      expect(isPriestAction({ type }), `expected false for ${type}`).toBe(false);
    }
  });

  it('returns false for empty or garbage types', () => {
    expect(isPriestAction({ type: '' })).toBe(false);
    expect(isPriestAction({ type: 'priest' })).toBe(false);
    expect(isPriestAction({ type: 'PRIEST-BELLS' })).toBe(false);
  });
});

describe('isChatMessage', () => {
  it('returns true for chat-message', () => {
    expect(isChatMessage({ type: 'chat-message' })).toBe(true);
  });

  it('returns true for chat-typing', () => {
    expect(isChatMessage({ type: 'chat-typing' })).toBe(true);
  });

  it('returns false for non-chat messages', () => {
    const otherTypes = [
      'join',
      'matched',
      'offer',
      'priest-bells',
      'priest-scripture',
      'end-session',
      'partner-left',
    ];
    for (const type of otherTypes) {
      expect(isChatMessage({ type }), `expected false for ${type}`).toBe(false);
    }
  });

  it('returns false for partial matches', () => {
    expect(isChatMessage({ type: 'chat' })).toBe(false);
    expect(isChatMessage({ type: 'chat-' })).toBe(false);
    expect(isChatMessage({ type: 'chat-msg' })).toBe(false);
  });
});
