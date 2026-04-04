import { useRef, useState } from 'react';
import { SignalingClient } from '../../../lib/signaling';
import { UserRole } from '../../../lib/types';

export function useMatchmaking(apiUrl: string) {
  const [waitingPosition, setWaitingPosition] = useState(0);
  const [isInitiator, setIsInitiator] = useState(false);
  const signalingRef = useRef<SignalingClient | null>(null);

  const connect = async (
    role: UserRole,
    priestId: string | undefined,
    onMatched: (initiator: boolean) => void
  ) => {
    const signaling = new SignalingClient(apiUrl);
    signalingRef.current = signaling;

    // Attach listener BEFORE opening the socket
    signaling.onMessage((msg) => {
      if (msg.type === 'waiting') {
        setWaitingPosition(msg.position);
      }

      if (msg.type === 'matched') {
        setIsInitiator(msg.initiator);
        onMatched(msg.initiator);
      }
    });

    try {
      await signaling.connect(role, priestId);
    } catch (e) {
      console.error('Failed to connect to matchmaker:', e);
    }
  };

  const disconnect = () => {
    signalingRef.current?.disconnect();
  };

  return { waitingPosition, isInitiator, signalingRef, connect, disconnect };
}
