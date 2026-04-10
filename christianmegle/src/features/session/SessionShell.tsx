import { useEffect, useRef } from 'react';
import { SignalingClient } from '../../lib/signaling';
import { UserRole } from '../../lib/types';

// Feature hooks
import { useWebRTC } from '../confession-session/hooks/useWebRTC';
import { usePriestActions } from '../priest-toolkit/hooks/usePriestActions';
import { useChat } from '../chat/hooks/useChat';
import { useSessionMessageRouter } from './useSessionMessageRouter';
import { useSessionScreenshot } from './useSessionScreenshot';

// Feature UI
import { VideoPanel } from '../confession-session/ui/VideoPanel';
import EffectsOverlay from '../priest-toolkit/ui/EffectsOverlay';
import PriestToolbar from '../priest-toolkit/ui/PriestToolbar';
import AtmosphereToolbar from '../priest-toolkit/ui/AtmosphereToolbar';
import BookOfLife from '../priest-toolkit/ui/BookOfLife';
import { ChatPanel } from '../chat/ui/ChatPanel';

interface SessionShellProps {
  signaling: SignalingClient;
  role: UserRole;
  isInitiator: boolean;
  apiUrl: string;
  onSessionEnd: () => void;
  onExcommunicate?: () => void;
  /** Triggered when either party asks to be rematched mid-session. */
  onSwitchPartner?: () => void;
  /**
   * Called with a JPEG data URL every time the session screenshot hook
   * fires (automatic 1:11 / 33:33 / 1:11:11, or manual early-end).
   * The caller owns the single-slot state; this component only pushes
   * into it, it doesn't read from it.
   */
  onScreenshot?: (dataUrl: string) => void;
}

export default function SessionShell({
  signaling,
  role,
  isInitiator,
  apiUrl,
  onSessionEnd,
  onExcommunicate,
  onSwitchPartner,
  onScreenshot,
}: SessionShellProps) {
  // --- Feature hooks ---
  const session = useWebRTC(signaling, isInitiator, apiUrl);
  const priest = usePriestActions(signaling);
  const chat = useChat(signaling, role);

  // Route incoming signaling messages to the right feature hook.
  useSessionMessageRouter(signaling, chat, priest);

  // Timed screenshots (1:11 / 33:33 / 1:11:11) plus early-end capture.
  // The hook no-ops if onScreenshot isn't provided.
  const screenshot = useSessionScreenshot({
    localVideoRef: session.localVideoRef,
    remoteVideoRef: session.remoteVideoRef,
    sessionActive: session.sessionActive,
    onCapture: onScreenshot ?? (() => {}),
  });

  const captureIfEarly = () => {
    // Only snap on exit if no timed trigger has fired yet during this
    // session, AND we have somewhere to push it. This enforces the
    // rule: "ends before 1:11 → snap on exit; ends ≥ 1:11 → no snap".
    if (onScreenshot && !screenshot.hasCapturedRef.current) {
      screenshot.captureNow();
    }
  };

  const handleEndSession = () => {
    captureIfEarly();
    session.endSession();
    onSessionEnd();
  };

  const handleSwitchPartner = () => {
    // Tear down the current WebRTC session locally, then kick the
    // state machine back into matchmaking. The useMatchmaking effect
    // will reconnect the signaling socket automatically.
    captureIfEarly();
    session.endSession();
    onSwitchPartner?.();
  };

  // If the remote party leaves on their own (no click on our side),
  // useWebRTC flips sessionActive false + connectionState 'ended'.
  // Fire an early-end capture from the falling edge of sessionActive.
  const prevActiveRef = useRef(false);
  useEffect(() => {
    if (prevActiveRef.current && !session.sessionActive) {
      captureIfEarly();
    }
    prevActiveRef.current = session.sessionActive;
    // captureIfEarly closes over fresh refs — intentionally only
    // retriggering on sessionActive changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.sessionActive]);

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
        onSwitchPartner={onSwitchPartner ? handleSwitchPartner : undefined}
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
        {session.sessionActive && role === 'priest' && (
          <PriestToolbar
            activeEffects={priest.activeEffects}
            silenceActive={priest.silenceActive}
            onSendScripture={priest.sendScripture}
            onToggleEffect={priest.sendToggleEffect}
            onRingBells={priest.ringBells}
            onToggleSilence={priest.toggleSilence}
            onExcommunicate={() => priest.excommunicate(() => {
              session.endSession();
              (onExcommunicate || onSessionEnd)();
            })}
          />
        )}
        {session.sessionActive && role === 'sinner' && (
          <AtmosphereToolbar
            activeEffects={priest.activeEffects}
            onToggleEffect={priest.sendToggleEffect}
            onRingBells={priest.ringBells}
          />
        )}
        {role === 'priest' && priest.bookEntries.length > 0 && (
          <BookOfLife entries={priest.bookEntries} />
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
  error: { position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--crimson-dim)', border: '1px solid var(--crimson)', padding: '0.75rem 1.5rem', zIndex: 30, color: 'var(--parchment)', fontStyle: 'italic', fontFamily: 'var(--font-terminal)', fontSize: '0.8rem' },
};
