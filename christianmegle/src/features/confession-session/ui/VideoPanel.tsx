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
          <button onClick={onEndSession} style={styles.endButton}>■ End Confession</button>
        ) : connectionState === 'ended' ? (
          <button onClick={onNext} style={styles.nextButton}>
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
  videoColumn: { display: 'flex', flexDirection: 'column', flex: '1 1 0', minWidth: 0, borderRight: '1px solid var(--border-subtle)', position: 'relative' },
  videoPanel: { flex: 1, position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-video)' },
  video: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  videoLabel: { position: 'absolute', bottom: '0.5rem', left: '0.75rem', fontFamily: 'var(--font-terminal)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ivory-dim)', background: 'var(--bg-overlay-light)', padding: '0.2rem 0.5rem', zIndex: 5 },
  videoOverlay: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-video)', gap: '1rem', zIndex: 4 },
  waitingIcon: { fontSize: '2.5rem' },
  waitingText: { fontFamily: 'var(--font-terminal)', fontSize: '0.75rem', color: 'var(--ivory-dim)', letterSpacing: '0.08em' },
  actionBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', background: 'var(--bg-video)', borderTop: '1px solid var(--border-subtle)', gap: '1rem', flexShrink: 0 },
  endButton: { background: 'var(--crimson-dim)', borderColor: 'var(--crimson)', fontFamily: 'var(--font-terminal)', fontSize: '0.7rem', padding: '0.4rem 1.2rem', letterSpacing: '0.05em', flexShrink: 0 },
  nextButton: { fontFamily: 'var(--font-terminal)', fontSize: '0.7rem', padding: '0.4rem 1.2rem', letterSpacing: '0.05em', flexShrink: 0 },
  roleTag: { fontFamily: 'var(--font-terminal)', fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--ivory-dim)', textTransform: 'uppercase' },
  timer: { color: 'var(--amber-dim)' },
};
