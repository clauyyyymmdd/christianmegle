import { UserRole } from '../../../lib/types';
import { screenStyles as s } from '../styles';

interface Props {
  role: UserRole;
  onRejoin: () => void;
  onHome: () => void;
}

export function SessionEndedScreen({ role, onRejoin, onHome }: Props) {
  return (
    <div style={s.centered} className="page-enter">
      <pre style={s.asciiComplete}>{`
╔══════════════════════════════════════╗
║       SESSION TERMINATED             ║
║                                      ║
║       GRACE: DISPENSED               ║
╚══════════════════════════════════════╝
      `}</pre>
      <p style={s.statusText}>
        {role === 'priest'
          ? 'May you continue to serve with grace.'
          : 'Go in peace. Your sins are heard.'}
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button onClick={onRejoin}>{role === 'priest' ? 'Hear Another' : 'Confess Again'}</button>
        <button onClick={onHome}>Return Home</button>
      </div>
    </div>
  );
}
