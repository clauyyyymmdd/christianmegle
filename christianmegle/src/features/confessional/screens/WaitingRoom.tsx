import { UserRole } from '../../../lib/types';
import { screenStyles as s } from '../styles';

interface Props {
  role: UserRole;
  waitingPosition: number;
  onLeave: () => void;
  onStartOver: () => void;
}

export function WaitingRoom({ role, waitingPosition, onLeave, onStartOver }: Props) {
  return (
    <div style={s.centered} className="page-enter">
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
      {waitingPosition > 0 && (
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
