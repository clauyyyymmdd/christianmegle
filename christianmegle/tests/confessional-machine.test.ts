import { describe, it, expect } from 'vitest';
import { transition, initialState, type State } from '../src/features/confessional/machine';

describe('confessional state machine', () => {
  describe('initial state', () => {
    it('starts in loading for sinner', () => {
      const s = initialState('sinner');
      expect(s).toEqual({ kind: 'loading', role: 'sinner' });
    });

    it('starts in loading for priest', () => {
      const s = initialState('priest');
      expect(s).toEqual({ kind: 'loading', role: 'priest' });
    });
  });

  describe('boot transitions', () => {
    it('sinner boot → waiting', () => {
      const s = transition(initialState('sinner'), { type: 'BOOT_AS_SINNER' });
      expect(s.kind).toBe('waiting');
      expect(s.role).toBe('sinner');
    });

    it('new priest boot → quiz', () => {
      const s = transition(initialState('priest'), { type: 'BOOT_AS_PRIEST_NEW' });
      expect(s).toEqual({ kind: 'quiz', role: 'priest' });
    });

    it('returning priest boot → welcome-back', () => {
      const s = transition(initialState('priest'), { type: 'BOOT_AS_PRIEST_RETURNING' });
      expect(s).toEqual({ kind: 'welcome-back', role: 'priest' });
    });

    it('pending priest boot → applied', () => {
      const s = transition(initialState('priest'), { type: 'BOOT_AS_PRIEST_PENDING' });
      expect(s).toEqual({ kind: 'applied', role: 'priest' });
    });

    it('boot events are no-ops outside loading', () => {
      const s: State = { kind: 'quiz', role: 'priest' };
      expect(transition(s, { type: 'BOOT_AS_SINNER' })).toBe(s);
      expect(transition(s, { type: 'BOOT_AS_PRIEST_NEW' })).toBe(s);
    });
  });

  describe('quiz outcomes', () => {
    const quiz: State = { kind: 'quiz', role: 'priest' };

    it('passing the quiz → waiting (skips applied)', () => {
      const s = transition(quiz, { type: 'QUIZ_PASSED' });
      expect(s).toEqual({ kind: 'waiting', role: 'priest', position: 0 });
    });

    it('failing the quiz → still-a-sinner', () => {
      const s = transition(quiz, { type: 'QUIZ_FAILED' });
      expect(s).toEqual({ kind: 'still-a-sinner', role: 'priest' });
    });

    it('answering not-saved → not-saved screen', () => {
      const s = transition(quiz, { type: 'QUIZ_NOT_SAVED' });
      expect(s).toEqual({ kind: 'not-saved', role: 'priest' });
    });

    it('quiz events from non-quiz states are ignored', () => {
      const s: State = { kind: 'waiting', role: 'sinner', position: 0 };
      expect(transition(s, { type: 'QUIZ_PASSED' })).toBe(s);
      expect(transition(s, { type: 'QUIZ_FAILED' })).toBe(s);
    });
  });

  describe('priest approval', () => {
    const applied: State = { kind: 'applied', role: 'priest' };

    it('applied → welcome-back on PRIEST_APPROVED', () => {
      const s = transition(applied, { type: 'PRIEST_APPROVED' });
      expect(s).toEqual({ kind: 'welcome-back', role: 'priest' });
    });

    it('applied → still-a-sinner on PRIEST_REJECTED', () => {
      const s = transition(applied, { type: 'PRIEST_REJECTED' });
      expect(s).toEqual({ kind: 'still-a-sinner', role: 'priest' });
    });

    it('approval from non-applied states is ignored', () => {
      const s: State = { kind: 'quiz', role: 'priest' };
      expect(transition(s, { type: 'PRIEST_REJECTED' })).toBe(s);
    });
  });

  describe('matchmaking', () => {
    it('welcome-back → waiting on ENTER_CONFESSIONAL', () => {
      const s = transition({ kind: 'welcome-back', role: 'priest' }, { type: 'ENTER_CONFESSIONAL' });
      expect(s).toEqual({ kind: 'waiting', role: 'priest', position: 0 });
    });

    it('not-saved → waiting on BECOME_SINNER', () => {
      const s = transition({ kind: 'not-saved', role: 'priest' }, { type: 'BECOME_SINNER' });
      expect(s).toEqual({ kind: 'waiting', role: 'sinner', position: 0 });
    });

    it('still-a-sinner → waiting on BECOME_SINNER', () => {
      const s = transition({ kind: 'still-a-sinner', role: 'priest' }, { type: 'BECOME_SINNER' });
      expect(s).toEqual({ kind: 'waiting', role: 'sinner', position: 0 });
    });

    it('START_OVER from any state → quiz', () => {
      const states: State[] = [
        { kind: 'welcome-back', role: 'priest' },
        { kind: 'waiting', role: 'priest', position: 3 },
        { kind: 'ended', role: 'priest' },
      ];
      for (const s of states) {
        const next = transition(s, { type: 'START_OVER' });
        expect(next.kind).toBe('quiz');
      }
    });

    it('updates queue position via WAITING event', () => {
      const start: State = { kind: 'waiting', role: 'sinner', position: 0 };
      const s = transition(start, { type: 'WAITING', position: 3 });
      expect(s).toEqual({ kind: 'waiting', role: 'sinner', position: 3 });
    });

    it('waiting → connected on MATCHED carries isInitiator', () => {
      const start: State = { kind: 'waiting', role: 'sinner', position: 2 };
      const s = transition(start, { type: 'MATCHED', isInitiator: false });
      expect(s).toEqual({ kind: 'connected', role: 'sinner', isInitiator: false });
    });

    it('MATCHED with isInitiator=true', () => {
      const start: State = { kind: 'waiting', role: 'priest', position: 1 };
      const s = transition(start, { type: 'MATCHED', isInitiator: true });
      expect(s).toEqual({ kind: 'connected', role: 'priest', isInitiator: true });
    });
  });

  describe('session lifecycle', () => {
    const connected: State = { kind: 'connected', role: 'sinner', isInitiator: false };

    it('connected → ended on SESSION_ENDED', () => {
      const s = transition(connected, { type: 'SESSION_ENDED' });
      expect(s).toEqual({ kind: 'ended', role: 'sinner' });
    });

    it('connected → waiting on EXCOMMUNICATE (skips ended)', () => {
      const s = transition(connected, { type: 'EXCOMMUNICATE' });
      expect(s).toEqual({ kind: 'waiting', role: 'sinner', position: 0 });
    });

    it('ended → waiting on REJOIN', () => {
      const s = transition({ kind: 'ended', role: 'priest' }, { type: 'REJOIN' });
      expect(s).toEqual({ kind: 'waiting', role: 'priest', position: 0 });
    });

    it('connected → waiting on SWITCH_PARTNER (skips ended)', () => {
      const s = transition(connected, { type: 'SWITCH_PARTNER' });
      expect(s).toEqual({ kind: 'waiting', role: 'sinner', position: 0 });
    });

    it('SESSION_ENDED is no-op outside connected', () => {
      const s: State = { kind: 'waiting', role: 'sinner', position: 0 };
      expect(transition(s, { type: 'SESSION_ENDED' })).toBe(s);
    });

    it('SWITCH_PARTNER is no-op outside connected', () => {
      const s: State = { kind: 'waiting', role: 'sinner', position: 0 };
      expect(transition(s, { type: 'SWITCH_PARTNER' })).toBe(s);
    });
  });

  describe('full happy path: priest with returning credentials', () => {
    it('loading → welcome-back → waiting → connected → ended → waiting (rejoin)', () => {
      let s = initialState('priest');
      s = transition(s, { type: 'BOOT_AS_PRIEST_RETURNING' });
      expect(s.kind).toBe('welcome-back');

      s = transition(s, { type: 'ENTER_CONFESSIONAL' });
      expect(s.kind).toBe('waiting');

      s = transition(s, { type: 'WAITING', position: 1 });
      expect(s.kind).toBe('waiting');
      if (s.kind === 'waiting') expect(s.position).toBe(1);

      s = transition(s, { type: 'MATCHED', isInitiator: true });
      expect(s.kind).toBe('connected');

      s = transition(s, { type: 'SESSION_ENDED' });
      expect(s.kind).toBe('ended');

      s = transition(s, { type: 'REJOIN' });
      expect(s.kind).toBe('waiting');
    });
  });

  describe('full happy path: new priest passes quiz (auto-approved)', () => {
    it('loading → quiz → waiting → connected', () => {
      let s = initialState('priest');
      s = transition(s, { type: 'BOOT_AS_PRIEST_NEW' });
      expect(s.kind).toBe('quiz');

      s = transition(s, { type: 'QUIZ_PASSED' });
      expect(s.kind).toBe('waiting');

      s = transition(s, { type: 'MATCHED', isInitiator: true });
      expect(s.kind).toBe('connected');
    });
  });

  describe('failure path: quiz fails → become sinner', () => {
    it('loading → quiz → still-a-sinner → waiting (as sinner)', () => {
      let s = initialState('priest');
      s = transition(s, { type: 'BOOT_AS_PRIEST_NEW' });
      s = transition(s, { type: 'QUIZ_FAILED' });
      expect(s).toEqual({ kind: 'still-a-sinner', role: 'priest' });

      s = transition(s, { type: 'BECOME_SINNER' });
      expect(s).toEqual({ kind: 'waiting', role: 'sinner', position: 0 });
    });
  });
});
