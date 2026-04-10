import type { UserRole } from '../../lib/types';

/**
 * Confessional flow state machine.
 *
 * States are a discriminated union — each state can carry data unique to it,
 * so impossible combinations (e.g. waiting + waitingPosition undefined) are
 * eliminated at the type level.
 *
 * Events are the only way to transition. The `transition` function is the
 * single source of truth for what state can become what other state.
 */

// ── States ──────────────────────────────────────────────────────────

export type State =
  | { kind: 'loading'; role: UserRole }
  | { kind: 'welcome-back'; role: UserRole }
  | { kind: 'quiz'; role: UserRole }
  | { kind: 'not-saved'; role: UserRole }
  | { kind: 'applied'; role: UserRole }
  | { kind: 'still-a-sinner'; role: UserRole }
  | { kind: 'waiting'; role: UserRole; position: number }
  | { kind: 'connected'; role: UserRole; isInitiator: boolean }
  | { kind: 'ended'; role: UserRole };

export type StateKind = State['kind'];

// ── Events ──────────────────────────────────────────────────────────

export type Event =
  /** Loading hold expired — bootstrap the appropriate next state */
  | { type: 'BOOT_AS_SINNER' }
  | { type: 'BOOT_AS_PRIEST_NEW' }
  | { type: 'BOOT_AS_PRIEST_RETURNING' }
  | { type: 'BOOT_AS_PRIEST_PENDING' }
  /** Priest status check finished */
  | { type: 'PRIEST_APPROVED' }
  | { type: 'PRIEST_REJECTED' }
  /** Quiz outcomes */
  | { type: 'QUIZ_NOT_SAVED' }
  | { type: 'QUIZ_PASSED' }
  | { type: 'QUIZ_FAILED' }
  /** User actions from screens */
  | { type: 'BECOME_SINNER' }
  | { type: 'START_OVER' }
  | { type: 'ENTER_CONFESSIONAL' }
  | { type: 'REJOIN' }
  /** Matchmaking */
  | { type: 'WAITING'; position: number }
  | { type: 'MATCHED'; isInitiator: boolean }
  /** Session lifecycle */
  | { type: 'SESSION_ENDED' }
  | { type: 'EXCOMMUNICATE' }
  | { type: 'SWITCH_PARTNER' };

// ── Initial state ──────────────────────────────────────────────────

export function initialState(role: UserRole): State {
  return { kind: 'loading', role };
}

// ── Transition function ────────────────────────────────────────────

/**
 * The single place that decides which transitions are valid.
 * Returns the new state, or the old state unchanged if the event
 * doesn't apply (illegal transition is a silent no-op so timing
 * races don't crash, but every legal transition is explicit here).
 */
export function transition(state: State, event: Event): State {
  switch (event.type) {
    // ── Boot ──
    case 'BOOT_AS_SINNER':
      if (state.kind !== 'loading') return state;
      return { kind: 'waiting', role: 'sinner', position: 0 };

    case 'BOOT_AS_PRIEST_NEW':
      if (state.kind !== 'loading') return state;
      return { kind: 'quiz', role: 'priest' };

    case 'BOOT_AS_PRIEST_RETURNING':
      if (state.kind !== 'loading') return state;
      return { kind: 'welcome-back', role: 'priest' };

    case 'BOOT_AS_PRIEST_PENDING':
      if (state.kind !== 'loading') return state;
      return { kind: 'applied', role: 'priest' };

    // ── Priest approval polling ──
    case 'PRIEST_APPROVED':
      if (state.kind !== 'applied' && state.kind !== 'loading') return state;
      return { kind: 'welcome-back', role: 'priest' };

    case 'PRIEST_REJECTED':
      if (state.kind !== 'applied') return state;
      return { kind: 'still-a-sinner', role: state.role };

    // ── Quiz ──
    case 'QUIZ_NOT_SAVED':
      if (state.kind !== 'quiz') return state;
      return { kind: 'not-saved', role: state.role };

    case 'QUIZ_PASSED':
      if (state.kind !== 'quiz') return state;
      // Skip applied/approval — priest is auto-approved at submission.
      // Go straight to matchmaking.
      return { kind: 'waiting', role: 'priest', position: 0 };

    case 'QUIZ_FAILED':
      if (state.kind !== 'quiz') return state;
      return { kind: 'still-a-sinner', role: state.role };

    // ── User actions ──
    case 'BECOME_SINNER':
      // Allowed from not-saved, still-a-sinner
      if (state.kind !== 'not-saved' && state.kind !== 'still-a-sinner') return state;
      return { kind: 'waiting', role: 'sinner', position: 0 };

    case 'START_OVER':
      // Always go back to quiz (clears priest identity in caller)
      return { kind: 'quiz', role: state.role };

    case 'ENTER_CONFESSIONAL':
      if (state.kind !== 'welcome-back') return state;
      return { kind: 'waiting', role: state.role, position: 0 };

    case 'REJOIN':
      if (state.kind !== 'ended') return state;
      return { kind: 'waiting', role: state.role, position: 0 };

    // ── Matchmaking ──
    case 'WAITING':
      if (state.kind !== 'waiting') return state;
      return { ...state, position: event.position };

    case 'MATCHED':
      if (state.kind !== 'waiting') return state;
      return { kind: 'connected', role: state.role, isInitiator: event.isInitiator };

    // ── Session lifecycle ──
    case 'SESSION_ENDED':
      if (state.kind !== 'connected') return state;
      return { kind: 'ended', role: state.role };

    case 'EXCOMMUNICATE':
      // Priest excommunicates → straight back to matchmaking, skip ended
      if (state.kind !== 'connected') return state;
      return { kind: 'waiting', role: state.role, position: 0 };

    case 'SWITCH_PARTNER':
      // Sinner rolls for a new priest (or priest switches penitent) →
      // straight back to matchmaking, skip ended. Same target state as
      // EXCOMMUNICATE, but no excommunication semantics.
      if (state.kind !== 'connected') return state;
      return { kind: 'waiting', role: state.role, position: 0 };
  }
}
