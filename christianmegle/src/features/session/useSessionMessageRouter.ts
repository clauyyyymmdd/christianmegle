import { useCallback, useEffect } from 'react';
import { SignalingClient } from '../../lib/signaling';
import type { ServerMessage } from '../../../shared/types/messages';
import { isChatMessage, isPriestAction } from '../../../shared/types/messages';
import { useChat } from '../chat/hooks/useChat';
import { usePriestActions } from '../priest-toolkit/hooks/usePriestActions';

/**
 * Wires a SignalingClient's incoming messages to the chat and priest
 * feature hooks. Owns the routing logic and the onMessage subscription
 * so SessionShell stays a declarative composition of panels.
 */
export function useSessionMessageRouter(
  signaling: SignalingClient,
  chat: ReturnType<typeof useChat>,
  priest: ReturnType<typeof usePriestActions>,
) {
  const routeMessage = useCallback(
    (msg: ServerMessage) => {
      if (isChatMessage(msg)) {
        chat.handleIncoming(msg);
      } else if (isPriestAction(msg)) {
        priest.handleIncoming(msg);
      }
    },
    [chat.handleIncoming, priest.handleIncoming],
  );

  useEffect(() => {
    return signaling.onMessage(routeMessage);
  }, [signaling, routeMessage]);
}
