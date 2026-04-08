import { useState, useEffect, useRef } from 'react';
import { UserRole } from '../../../lib/types';
import { screenStyles as s } from '../styles';
import { LaceFrame } from '../../../lace';

interface Props {
  role: UserRole;
  waitingPosition: number;
  onLeave: () => void;
  onStartOver: () => void;
}

export function WaitingRoom({ role, waitingPosition, onLeave, onStartOver }: Props) {
  const [cameraStatus, setCameraStatus] = useState<'requesting' | 'granted' | 'denied'>('requesting');
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: { echoCancellation: true, noiseSuppression: true },
    })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraStatus('granted');
      })
      .catch(() => {
        if (!cancelled) setCameraStatus('denied');
      });

    return () => {
      cancelled = true;
      // Don't stop the stream — WebRTCManager will reuse the permission grant
    };
  }, []);

  return (
    <div style={s.centered} className="page-enter">
      <LaceFrame profile="waiting-room" />
      <pre style={s.asciiWaiting}>{`
     ║
     ║
 ════╬════
     ║
     ║
      `}</pre>
      <h2 style={{ marginTop: '1rem' }}>
        {role === 'priest' ? '> AWAITING PENITENT...' : '> AWAITING PRIEST...'}
      </h2>
      <p style={s.statusText}>
        {role === 'priest'
          ? 'A soul in need of confession will be with you shortly.'
          : 'A priest will hear your confession shortly.'}
      </p>

      {cameraStatus === 'requesting' && (
        <p style={s.positionText}>REQUESTING CAMERA ACCESS...</p>
      )}
      {cameraStatus === 'denied' && (
        <p style={{ ...s.positionText, color: 'var(--crimson)' }}>
          CAMERA ACCESS DENIED — confession requires video
        </p>
      )}
      {cameraStatus === 'granted' && waitingPosition > 0 && (
        <p style={s.positionText}>QUEUE POSITION: {waitingPosition}</p>
      )}

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <button onClick={onLeave}>Leave</button>
        {role === 'priest' && (
          <button onClick={onStartOver} style={{ opacity: 0.7 }}>Retake Quiz</button>
        )}
      </div>
    </div>
  );
}
