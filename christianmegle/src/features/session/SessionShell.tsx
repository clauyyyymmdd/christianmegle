import { useCallback, useEffect } from 'react';
import { SignalingClient } from '../../lib/signaling';
import { UserRole } from '../../lib/types';
import type { ServerMessage } from '../../../shared/types/messages';
import { isPriestAction, isChatMessage } from '../../../shared/types/messages';

// Feature hooks
import { useWebRTC } from '../confession-session/hooks/useWebRTC';
import { usePriestActions } from '../priest-toolkit/hooks/usePriestActions';
import { useChat } from '../chat/hooks/useChat';

// Feature UI
import { VideoPanel } from '../confession-session/ui/VideoPanel';
import EffectsOverlay from '../priest-toolkit/ui/EffectsOverlay';
import PriestToolbar from '../priest-toolkit/ui/PriestToolbar';
import BookOfLife from '../priest-toolkit/ui/BookOfLife';
import { ChatPanel } from '../chat/ui/ChatPanel';
import { LaceFrame } from '../../lace';

interface SessionShellProps {
  signaling: SignalingClient;
  role: UserRole;
  isInitiator: boolean;
  apiUrl: string;
  onSessionEnd: () => void;
  onExcommunicate?: () => void;
}

export default function SessionShell({ signaling, role, isInitiator, apiUrl, onSessionEnd, onExcommunicate }: SessionShellProps) {
  // --- Feature hooks ---
  const session = useWebRTC(signaling, isInitiator, apiUrl);
  const priest = usePriestActions(signaling);
  const chat = useChat(signaling, role);

  const handleEndSession = () => {
    session.endSession();
    onSessionEnd();
  };

  // --- Signaling message router ---
  const routeMessage = useCallback(
    (msg: ServerMessage) => {
      if (isChatMessage(msg)) {
        chat.handleIncoming(msg);
      } else if (isPriestAction(msg)) {
        priest.handleIncoming(msg);
      }
    },
    [chat.handleIncoming, priest.handleIncoming]
  );

  useEffect(() => {
    const cleanup = signaling.onMessage(routeMessage);
    return cleanup;
  }, [signaling, routeMessage]);

  // --- Compose UI ---
  return (
    <div style={styles.container}>
      <LaceFrame profile="confessional-screen" style={styles.laceFrame} />
      <VideoPanel
        localVideoRef={session.localVideoRef}
        remoteVideoRef={session.remoteVideoRef}
        connectionState={session.connectionState}
        sessionActive={session.sessionActive}
        elapsed={session.elapsed}
        role={role}
        formatTime={session.formatTime}
        onEndSession={handleEndSession}
        onNext={onSessionEnd}
        effectsOverlay={
          <EffectsOverlay
            activeEffects={priest.activeEffects}
            absolutionActive={priest.absolutionActive}
            silenceActive={priest.silenceActive}
            excommunicateActive={priest.excommunicateActive}
            currentPenance={priest.currentPenance}
            currentScripture={priest.currentScripture}
            onPenanceDismiss={priest.dismissPenance}
            onScriptureDismiss={priest.dismissScripture}
          />
        }
      >
        {role === 'priest' && (
          <>
            {session.sessionActive && (
              <PriestToolbar
                activeEffects={priest.activeEffects}
                silenceActive={priest.silenceActive}
                onSendPenance={priest.sendPenance}
                onGrantAbsolution={priest.grantAbsolution}
                onSendScripture={priest.sendScripture}
                onToggleEffect={priest.sendToggleEffect}
                onRingBells={priest.ringBells}
                onToggleSilence={priest.toggleSilence}
                onExcommunicate={() => priest.excommunicate(() => {
                  session.endSession();
                  (onExcommunicate || onSessionEnd)();
                })}
                onInscribe={priest.inscribe}
              />
            )}
            {priest.bookEntries.length > 0 && <BookOfLife entries={priest.bookEntries} />}
          </>
        )}
      </VideoPanel>

      <ChatPanel
        chatMessages={chat.chatMessages}
        chatInput={chat.chatInput}
        strangerTyping={chat.strangerTyping}
        chatEndRef={chat.chatEndRef}
        sessionActive={session.sessionActive}
        connectionState={session.connectionState}
        role={role}
        onSend={chat.sendMessage}
        onInputChange={chat.handleInputChange}
        onKeyDown={chat.handleKeyDown}
      />

      {session.error && (
        <div style={styles.error}><p>{session.error}</p></div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', width: '100%', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden', position: 'relative' },
  // Lace frame sits behind video panel only — dimmed so it doesn't fight chat readability
  laceFrame: {
    right: '320px', // chat panel width — confine to video column
    opacity: 0.25,
    mixBlendMode: 'screen',
  },
  error: { position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--crimson-dim)', border: '1px solid var(--crimson)', padding: '0.75rem 1.5rem', zIndex: 30, color: 'var(--parchment)', fontStyle: 'italic', fontFamily: 'var(--font-terminal)', fontSize: '0.8rem' },
};
