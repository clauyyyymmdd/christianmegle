import type { RefObject, ReactNode } from 'react';
import { UserRole } from '../../../lib/types';

interface VideoPanelProps {
  localVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
  connectionState: string;
  sessionActive: boolean;
  elapsed: number;
  role: UserRole;
  formatTime: (seconds: number) => string;
  onEndSession: () => void;
  onNext: () => void;
  /** Shown during an active session for sinners — rematch with a new priest. */
  onSwitchPartner?: () => void;
  /** Rendered inside the remote video container (e.g. priest effects) */
  effectsOverlay?: ReactNode;
  /** Rendered below the action bar (e.g. priest toolbar, book of life) */
  children?: ReactNode;
}

export function VideoPanel({
  localVideoRef,
  remoteVideoRef,
  connectionState,
  sessionActive,
  elapsed,
  role,
  formatTime,
  onEndSession,
  onNext,
  onSwitchPartner,
  effectsOverlay,
  children,
}: VideoPanelProps) {
  return (
    <div style={styles.videoColumn}>
      {/* Stranger video (top) */}
      <div className="video-container" style={styles.videoPanel}>
        <video ref={remoteVideoRef} autoPlay playsInline style={styles.video} />
        {!sessionActive && (
          <div style={styles.videoOverlay}>
            <div className="flicker" style={styles.waitingIcon}>🕯</div>
            <p style={styles.waitingText}>
              {connectionState === 'ended'
                ? 'The confession has ended.'
                : role === 'priest'
                  ? 'Awaiting penitent...'
                  : 'Awaiting priest...'}
            </p>
          </div>
        )}
        <div style={styles.videoLabel}>
          {role === 'priest' ? '🕯 Penitent' : '☦ Priest'}
        </div>
        {effectsOverlay}
      </div>

      {/* Local video (bottom) */}
      <div className="video-container" style={styles.videoPanel}>
        <video ref={localVideoRef} autoPlay playsInline muted style={styles.video} />
        <div style={styles.videoLabel}>
          {role === 'priest' ? '☦ You (Priest)' : '🕯 You (Penitent)'}
        </div>
      </div>

      {/* Action bar */}
      <div style={styles.actionBar}>
        {sessionActive ? (
          <div style={styles.buttonGroup}>
            <button onClick={onEndSession} style={styles.endButton} title="End this session">■ End Confession</button>
            {onSwitchPartner && (
              <button onClick={onSwitchPartner} style={styles.switchButton} title={role === 'priest' ? 'Match with a new penitent' : 'Match with a new priest'}>
                ⇆ {role === 'priest' ? 'Next Penitent' : 'Switch Priest'}
              </button>
            )}
          </div>
        ) : connectionState === 'ended' ? (
          <button onClick={onNext} style={styles.nextButton} title="Return to matchmaking">
            ▶ {role === 'priest' ? 'Next Penitent' : 'Confess Again'}
          </button>
        ) : null}
        <span style={styles.roleTag}>
          {role === 'priest' ? '☦ HEARING CONFESSION' : '🕯 CONFESSING'}
          {sessionActive && <span style={styles.timer}> · {formatTime(elapsed)}</span>}
        </span>
      </div>

      {children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  videoColumn: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 0',
    minWidth: 0,
    borderRight: '1px solid #2a2622',
    position: 'relative',
    overflow: 'auto',
    background: '#0a0808',
  },
  videoPanel: {
    position: 'relative',
    overflow: 'hidden',
    borderBottom: '1px solid #2a2622',
    background: '#0a0808',
    aspectRatio: '1 / 1',
    maxHeight: '45vh',
  },
  video: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  videoLabel: {
    position: 'absolute',
    bottom: '0.6rem',
    left: '0.75rem',
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#f5f0e6',
    background: '#0a0808',
    padding: '0.3rem 0.6rem',
    border: '1px solid #2a2622',
    zIndex: 5,
    fontWeight: 700,
  },
  videoOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0808',
    gap: '1rem',
    zIndex: 4,
  },
  waitingIcon: { fontSize: '2.5rem' },
  waitingText: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.85rem',
    color: '#f5f0e6',
    letterSpacing: '0.08em',
  },
  actionBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.85rem 1.25rem',
    background: '#15110f',
    borderTop: '1px solid #2a2622',
    gap: '1rem',
    flexShrink: 0,
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.6rem',
    alignItems: 'center',
  },
  endButton: {
    background: '#3a1a1a',
    border: '1px solid #6a2a2a',
    color: '#f5f0e6',
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.75rem',
    padding: '0.5rem 1.4rem',
    letterSpacing: '0.08em',
    fontWeight: 700,
    flexShrink: 0,
    cursor: 'pointer',
    borderRadius: '3px',
  },
  switchButton: {
    background: '#1c2a2a',
    border: '1px solid #3a5a5a',
    color: '#f5f0e6',
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.75rem',
    padding: '0.5rem 1.4rem',
    letterSpacing: '0.08em',
    fontWeight: 700,
    flexShrink: 0,
    cursor: 'pointer',
    borderRadius: '3px',
  },
  nextButton: {
    background: '#2a201c',
    border: '1px solid #5a4a40',
    color: '#f5f0e6',
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.75rem',
    padding: '0.5rem 1.4rem',
    letterSpacing: '0.08em',
    fontWeight: 700,
    flexShrink: 0,
    cursor: 'pointer',
    borderRadius: '3px',
  },
  roleTag: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.7rem',
    letterSpacing: '0.12em',
    color: '#c9c0b0',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  timer: { color: '#f5f0e6' },
};
