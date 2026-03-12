// === Roles ===
export type UserRole = 'priest' | 'sinner';

// === Signaling ===
export type SignalMessage =
  | { type: 'join'; role: UserRole; priestId?: string }
  | { type: 'matched'; partnerId: string; initiator: boolean }
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit }
  | { type: 'end-session' }
  | { type: 'partner-left' }
  | { type: 'waiting'; position: number }
  | { type: 'error'; message: string };

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
