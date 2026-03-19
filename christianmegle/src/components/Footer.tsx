import { useState, useEffect } from 'react';
import { getRandomVerse } from '../lib/footer-verses';

export default function Footer() {
  const [verse, setVerse] = useState(() => getRandomVerse());

  useEffect(() => {
    setVerse(getRandomVerse());
  }, []);

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <span style={styles.border}>╔════════════════════════════════════════════════════════════╗</span>
        <div style={styles.verseContainer}>
          <span style={styles.prompt}>&gt; </span>
          <span style={styles.verseText}>"{verse.text}"</span>
        </div>
        <div style={styles.reference}>
          <span style={styles.refLabel}>// SOURCE: </span>
          <span style={styles.refValue}>{verse.reference}</span>
        </div>
        <span style={styles.border}>╚════════════════════════════════════════════════════════════╝</span>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'linear-gradient(to top, var(--bg-primary) 60%, transparent 100%)',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-terminal)',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '700px',
    margin: '0 auto',
  },
  border: {
    color: 'var(--amber-dim)',
    fontSize: '0.5rem',
    letterSpacing: '-0.1em',
    opacity: 0.5,
  },
  verseContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '0.5rem 0',
    maxWidth: '600px',
  },
  prompt: {
    color: 'var(--amber-dim)',
    fontSize: '0.75rem',
    flexShrink: 0,
  },
  verseText: {
    color: 'var(--text-dim)',
    fontSize: '0.75rem',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },
  reference: {
    marginBottom: '0.25rem',
  },
  refLabel: {
    color: 'var(--text-dim)',
    fontSize: '0.65rem',
  },
  refValue: {
    color: 'var(--amber-dim)',
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};
