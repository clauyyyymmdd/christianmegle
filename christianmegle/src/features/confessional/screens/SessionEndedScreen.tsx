import { UserRole } from '../../../lib/types';
import { screenStyles as s } from '../styles';

interface Props {
  role: UserRole;
  onRejoin: () => void;
  onHome: () => void;
  /**
   * A JPEG data URL captured during the session (1:11 / 33:33 / 1:11:11
   * or on early end). Null if the session ended before any capture
   * fired on our side (e.g. the initial connect failed before video
   * was ever attached).
   */
  screenshotDataUrl: string | null;
}

export function SessionEndedScreen({ role, onRejoin, onHome, screenshotDataUrl }: Props) {
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

      {screenshotDataUrl && (
        <div style={screenshotStyles.wrap}>
          <p style={screenshotStyles.caption}>a moment, preserved.</p>
          <img
            src={screenshotDataUrl}
            alt="Session screenshot"
            style={screenshotStyles.image}
          />
          <button
            disabled
            title="Coming soon"
            style={screenshotStyles.emailButton}
          >
            email to self — coming soon
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button onClick={onRejoin}>{role === 'priest' ? 'Hear Another' : 'Confess Again'}</button>
        <button onClick={onHome}>Return Home</button>
      </div>
    </div>
  );
}

const screenshotStyles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '2rem',
    width: '100%',
    maxWidth: 520,
  },
  caption: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    color: 'var(--ivory-dim)',
    textTransform: 'uppercase',
    margin: 0,
  },
  image: {
    width: '100%',
    aspectRatio: '16 / 9',
    objectFit: 'cover',
    display: 'block',
    border: '1px solid #2a2622',
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.55)',
    background: '#000',
  },
  emailButton: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    padding: '0.6rem 1.2rem',
    background: 'transparent',
    color: 'var(--ivory-dim)',
    border: '1px solid var(--border-subtle)',
    cursor: 'not-allowed',
    opacity: 0.55,
  },
};
