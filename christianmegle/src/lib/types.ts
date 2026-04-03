// === Roles ===
export type UserRole = 'priest' | 'sinner';

// === Priest Toolkit Types ===
export type PenanceType =
  | 'hail-mary'
  | 'our-father'
  | 'rosary'
  | 'stations'
  | 'fasting'
  | 'almsgiving'
  | 'custom';

export type VisualEffectType =
  | 'absolution'
  | 'stained-glass'
  | 'incense'
  | 'candlelight'
  | 'holy-water';

export type SinCategory =
  | 'pride'
  | 'greed'
  | 'lust'
  | 'envy'
  | 'gluttony'
  | 'wrath'
  | 'sloth';

export interface ScriptureVerse {
  reference: string;
  text: string;
  category: SinCategory;
}

export interface PenanceAssignment {
  type: PenanceType;
  quantity?: number;
  customText?: string;
}

export interface BookEntry {
  id: string;
  text: string;
  timestamp: number;
}

// === Signaling ===
// Canonical message types live in shared/types/messages.ts.
// Re-exported here for backward compatibility.
export type {
  SignalMessage,
  ClientMessage,
  ServerMessage,
  RelayedMessage,
  PriestActionMessage,
} from '../../shared/types/messages';
export { isPriestAction, isChatMessage } from '../../shared/types/messages';

// === Priest ===
export interface PriestApplication {
  id?: string;
  displayName: string;
  email?: string;
  quizScore: number;
  quizTotal: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  approvedAt?: string;
  notes?: string;
}

// === Quiz ===
export interface QuizQuestion {
  id: number;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  category: 'scripture' | 'weird' | 'theology';
  difficulty: number;
}

// The correct answer is never sent to the client
export interface QuizQuestionWithAnswer extends QuizQuestion {
  correctOption: 'a' | 'b' | 'c' | 'd';
}

export interface QuizSubmission {
  answers: Record<number, 'a' | 'b' | 'c' | 'd'>;
}

export interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
  corrections: Record<number, { yours: string; correct: string }>;
}

// === Session ===
export interface Session {
  id: string;
  priestId: string;
  startedAt: string;
  endedAt?: string;
  endedBy?: 'priest' | 'sinner' | 'disconnect';
  durationSeconds?: number;
}

// === WebRTC Config ===
export interface RTCConfig {
  iceServers: RTCIceServer[];
}

export const DEFAULT_RTC_CONFIG: RTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TURN server added at runtime from env
  ],
};
