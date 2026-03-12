import { useEffect, useRef, useState } from 'react';
import { WebRTCManager } from '../lib/webrtc';
import { SignalingClient } from '../lib/signaling';
import { UserRole } from '../lib/types';

interface VideoChatProps {
  signaling: SignalingClient;
  role: UserRole;
  onSessionEnd: () => void;
}

export default function VideoChat({ signaling, role, onSessionEnd }: VideoChatProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const rtcRef = useRef<WebRTCManager | null>(null);
  const [connectionState, setConnectionState] = useState<string>('connecting');
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const rtc = new WebRTCManager(signaling, {
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setSessionActive(true);
        setConnectionState('connected');

        // Start timer
        timerRef.current = setInterval(() => {
          setElapsed((prev) => prev + 1);
        }, 1000);
      },
      onConnectionStateChange: (state) => {
        setConnectionState(state);
      },
      onPartnerLeft: () => {
        setSessionActive(false);
        setConnectionState('ended');
        if (timerRef.current) clearInterval(timerRef.current);
      },
      onError: (err) => {
        setError(err);
      },
    });

    rtcRef.current = rtc;

    // Get local video immediately
    rtc.getLocalStream().then((stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

    // Listen for match
    const cleanup = signaling.onMessage(async (msg) => {
      if (msg.type === 'matched') {
        await rtc.initialize(msg.initiator);
      }
    });

    return () => {
      cleanup();
      if (timerRef.current) clearInterval(timerRef.current);
      rtc.destroy();
    };
  }, [signaling]);

  const handleEndSession = () => {
    rtcRef.current?.endSession();
    if (timerRef.current) clearInterval(timerRef.current);
    onSessionEnd();
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      {/* Remote video (full screen) */}
      <div className="video-container" style={styles.remoteVideo}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={styles.video}
        />
        {!sessionActive && (
          <div style={styles.videoOverlay}>
            <div className="flicker" style={styles.waitingIcon}>🕯</div>
            <p style={styles.waitingText}>
              {connectionState === 'ended'
                ? 'The confession has ended.'
                : role === 'priest'
                  ? 'Waiting for a soul to confess...'
                  : 'Waiting for a priest to hear your confession...'}
            </p>
          </div>
        )}
      </div>

      {/* Local video (small overlay) */}
      <div className="video-container local" style={styles.localVideo}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={styles.video}
        />
        <div style={styles.localLabel}>
          {role === 'priest' ? '☦ Priest' : 'Penitent'}
        </div>
      </div>

      {/* Controls bar */}
      <div style={styles.controls}>
        <div style={styles.controlsLeft}>
          <span style={styles.roleTag}>
            {role === 'priest' ? '☦ HEARING CONFESSION' : '🕯 CONFESSING'}
          </span>
          {sessionActive && (
            <span style={styles.timer}>{formatTime(elapsed)}</span>
          )}
        </div>

        <div style={styles.controlsRight}>
          {sessionActive && (
            <button onClick={handleEndSession} style={styles.endButton}>
              End Confession
            </button>
          )}
          {connectionState === 'ended' && (
            <button onClick={onSessionEnd} style={styles.nextButton}>
              {role === 'priest' ? 'Next Penitent' : 'Confess Again'}
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div style={styles.error}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    background: 'var(--bg-primary)',
    overflow: 'hidden',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    gap: '1.5rem',
  },
  waitingIcon: {
    fontSize: '3rem',
  },
  waitingText: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    fontSize: '1.1rem',
  },
  localVideo: {
    position: 'absolute',
    bottom: '5rem',
    right: '1.5rem',
    width: '200px',
    height: '150px',
    zIndex: 10,
  },
  localLabel: {
    position: 'absolute',
    bottom: '0.5rem',
    left: '0.5rem',
    fontFamily: 'var(--font-display)',
    fontSize: '0.6rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    background: 'rgba(10, 9, 8, 0.7)',
    padding: '0.2rem 0.5rem',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    background: 'linear-gradient(transparent, rgba(10, 9, 8, 0.95))',
    zIndex: 20,
  },
  controlsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  controlsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  roleTag: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    color: 'var(--gold-dim)',
  },
  timer: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)',
  },
  endButton: {
    background: 'var(--crimson-dim)',
    borderColor: 'var(--crimson)',
    fontSize: '0.75rem',
    padding: '0.5rem 1.5rem',
  },
  nextButton: {
    fontSize: '0.75rem',
    padding: '0.5rem 1.5rem',
  },
  error: {
    position: 'absolute',
    top: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--crimson-dim)',
    border: '1px solid var(--crimson)',
    padding: '0.75rem 1.5rem',
    zIndex: 30,
    color: 'var(--parchment)',
    fontStyle: 'italic',
  },
};
