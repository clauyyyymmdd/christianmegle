import { useNavigate } from 'react-router-dom';

export default function Offering() {
  const navigate = useNavigate();

  return (
    <div className="page-enter" style={styles.container}>
      <pre style={styles.ascii}>{`
╔══════════════════════════════════════╗
║                                      ║
║            O F F E R I N G           ║
║                                      ║
╚══════════════════════════════════════╝
      `}</pre>
      <p style={styles.text}>Coming soon.</p>
      <div style={styles.backLink} onClick={() => navigate('/')}>
        {'>'} Return Home _
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center',
    background: 'var(--bg-primary)',
    fontFamily: 'var(--font-terminal)',
  },
  ascii: {
    color: 'var(--amber)',
    fontSize: '0.7rem',
    lineHeight: 1.3,
    margin: 0,
    textShadow: '0 0 15px rgba(255, 176, 0, 0.5)',
  },
  text: {
    color: 'var(--text-secondary)',
    marginTop: '1.5rem',
    fontSize: '0.9rem',
  },
  backLink: {
    marginTop: '2rem',
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.85rem',
    color: 'var(--ivory-dim)',
    cursor: 'pointer',
  },
};
