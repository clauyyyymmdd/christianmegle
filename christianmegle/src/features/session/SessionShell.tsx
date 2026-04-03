import { useCallback, useEffect } from 'react';
import { SignalingClient } from '../../lib/signaling';
import { UserRole } from '../../lib/types';
// Feature hooks
import { useWebRTC } from '../confession-session/hooks/useWebRTC';
import { usePriestActions } from '../priest-toolkit/hooks/usePriestActions';
import { useChat } from '../chat/hooks/useChat';

// Feature UI
import { VideoPanel } from '../confession-session/ui/VideoPanel';
import { PriestOverlay } from '../priest-toolkit/ui/PriestOverlay';
import { PriestControls } from '../priest-toolkit/ui/PriestControls';
import { ChatPanel } from '../chat/ui/ChatPanel';

interface SessionShellProps {
  signaling: SignalingClient;
  role: UserRole;
  isInitiator: boolean;
  onSessionEnd: () => void;
}

export default function SessionShell({ signaling, role, isInitiator, onSessionEnd }: SessionShellProps) {
  // --- Feature hooks ---
  const session = useWebRTC(signaling, isInitiator);
  const priest = usePriestActions(signaling);
  const chat = useChat(signaling, role);

  const handleEndSession = () => {
    session.endSession();
    onSessionEnd();
  };

  // --- Signaling message router ---
  const routeMessage = useCallback(
    (msg: Record<string, unknown>) => {
      const type = (msg as any).type as string;
      if (type.startsWith('chat-')) {
        chat.handleIncoming(msg as any);
      } else if (type.startsWith('priest-')) {
        priest.handleIncoming(msg as any);
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
          <PriestOverlay
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
          <PriestControls
            sessionActive={session.sessionActive}
            activeEffects={priest.activeEffects}
            silenceActive={priest.silenceActive}
            bookEntries={priest.bookEntries}
            onSendPenance={priest.sendPenance}
            onGrantAbsolution={priest.grantAbsolution}
            onSendScripture={priest.sendScripture}
            onToggleEffect={priest.sendToggleEffect}
            onRingBells={priest.ringBells}
            onToggleSilence={priest.toggleSilence}
            onExcommunicate={() => priest.excommunicate(handleEndSession)}
            onInscribe={priest.inscribe}
          />
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
  container: { display: 'flex', width: '100%', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' },
  error: { position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--crimson-dim)', border: '1px solid var(--crimson)', padding: '0.75rem 1.5rem', zIndex: 30, color: 'var(--parchment)', fontStyle: 'italic', fontFamily: 'var(--font-terminal)', fontSize: '0.8rem' },
};
