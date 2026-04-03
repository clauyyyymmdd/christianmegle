import type {
  UserRole,
  PenanceAssignment,
  ScriptureVerse,
  VisualEffectType,
} from '../../src/lib/types';

// ── WebRTC signaling (relayed peer-to-peer) ─────────────────────────

export type OfferMessage = { type: 'offer'; sdp: RTCSessionDescriptionInit };
export type AnswerMessage = { type: 'answer'; sdp: RTCSessionDescriptionInit };
export type IceCandidateMessage = { type: 'ice-candidate'; candidate: RTCIceCandidateInit };

// ── Priest toolkit (priest → sinner, relayed by server) ─────────────

export type PriestPenanceMessage = { type: 'priest-penance'; penance: PenanceAssignment };
export type PriestAbsolutionMessage = { type: 'priest-absolution' };
export type PriestScriptureMessage = { type: 'priest-scripture'; verse: ScriptureVerse };
export type PriestEffectMessage = { type: 'priest-effect'; effect: VisualEffectType };
export type PriestExcommunicateMessage = { type: 'priest-excommunicate' };
export type PriestSilenceMessage = { type: 'priest-silence'; active: boolean };
export type PriestInscribeMessage = { type: 'priest-inscribe'; text: string };
export type PriestBellsMessage = { type: 'priest-bells' };

export type PriestActionMessage =
  | PriestPenanceMessage
  | PriestAbsolutionMessage
  | PriestScriptureMessage
  | PriestEffectMessage
  | PriestExcommunicateMessage
  | PriestSilenceMessage
  | PriestInscribeMessage
  | PriestBellsMessage;

// ── Chat (either direction, relayed) ────────────────────────────────

export type ChatTextMessage = { type: 'chat-message'; text: string; sender: UserRole };
export type ChatTypingMessage = { type: 'chat-typing'; isTyping: boolean };

// ── Relayed messages (appear in both client and server unions) ───────

export type RelayedMessage =
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | PriestActionMessage
  | ChatTextMessage
  | ChatTypingMessage;

// ── Client → Server only ────────────────────────────────────────────

export type JoinMessage = { type: 'join'; role: UserRole; priestId?: string };
export type EndSessionMessage = { type: 'end-session' };

// ── Server → Client only ────────────────────────────────────────────

export type MatchedMessage = { type: 'matched'; partnerId: string; initiator: boolean };
export type WaitingMessage = { type: 'waiting'; position: number };
export type PartnerLeftMessage = { type: 'partner-left' };
export type ErrorMessage = { type: 'error'; message: string };

// ── Aggregate unions ────────────────────────────────────────────────

export type ClientMessage =
  | JoinMessage
  | EndSessionMessage
  | RelayedMessage;

export type ServerMessage =
  | MatchedMessage
  | WaitingMessage
  | PartnerLeftMessage
  | ErrorMessage
  | RelayedMessage;

/** Full union — backward compatible with the old SignalMessage type. */
export type SignalMessage = ClientMessage | ServerMessage;

// ── Type guards ─────────────────────────────────────────────────────

export function isPriestAction(msg: { type: string }): msg is PriestActionMessage {
  return (msg.type).startsWith('priest-');
}

export function isChatMessage(msg: { type: string }): msg is ChatTextMessage | ChatTypingMessage {
  return msg.type === 'chat-message' || msg.type === 'chat-typing';
}
