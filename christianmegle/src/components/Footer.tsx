import { useState, useEffect } from 'react';
import { getRandomVerse } from '../lib/footer-verses';

export default function Footer() {
  const [verse, setVerse] = useState(() => getRandomVerse());

  // Get a new random verse on mount
  useEffect(() => {
    setVerse(getRandomVerse());
  }, []);

  return (
    <footer style={styles.footer}>
      <div style={styles.verseContainer}>
        <p style={styles.verseText}>"{verse.text}"</p>
        <p style={styles.verseReference}>— {verse.reference}</p>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '100vw',
    padding: '1.5rem 2rem',
    background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 100%)',
    pointerEvents: 'none',
    boxSizing: 'border-box' as const,
    textAlign: 'center',
  },
  verseContainer: {
    display: 'inline-block',
    textAlign: 'center',
    maxWidth: '600px',
  },
  verseText: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '0.85rem',
    color: 'var(--text-dim)',
    margin: 0,
    lineHeight: 1.6,
  },
  verseReference: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    color: 'var(--gold-dim)',
    marginTop: '0.5rem',
    textTransform: 'uppercase',
  },
};
