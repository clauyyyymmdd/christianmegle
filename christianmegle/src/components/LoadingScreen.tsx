import { useState, useEffect } from 'react';

const loadingMessages = [
  'ESTABLISHING SACRED CONNECTION...',
  'LOADING CONFESSION PROTOCOLS...',
  'INITIALIZING GRACE BUFFERS...',
  'PREPARING ABSOLUTION SEQUENCE...',
  'SYNCING WITH HEAVENLY SERVERS...',
  'CALIBRATING PENITENCE MODULES...',
];

// ASCII cross patterns for terminal
const crossPattern = `
       ║
       ║
   ════╬════
       ║
       ║
`;

const roseWindow = `
    ╔═══════════╗
   ╔╝           ╚╗
  ╔╝      †      ╚╗
 ╔╝    ╱   ╲      ╚╗
 ║   ╱   ✦   ╲     ║
 ║  ╱    │    ╲    ║
 ║  ╲    │    ╱    ║
 ║   ╲   ✦   ╱     ║
 ╚╗    ╲   ╱      ╔╝
  ╚╗      †      ╔╝
   ╚╗           ╔╝
    ╚═══════════╝
`;

const chalice = `
      ╱▔▔▔╲
     ╱     ╲
     ╲     ╱
      ╲   ╱
       │ │
       │ │
     ╱─────╲
`;

const patterns = [crossPattern, roseWindow, chalice];

export default function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [patternIndex, setPatternIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
      setPatternIndex(prev => (prev + 1) % patterns.length);
    }, 2000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div style={styles.container}>
      <pre style={styles.pattern}>{patterns[patternIndex]}</pre>

      <div style={styles.messageContainer}>
        <span style={styles.prompt}>&gt; </span>
        <span style={styles.message}>{loadingMessages[messageIndex]}</span>
        <span style={styles.dots}>{dots}</span>
      </div>

      <div style={styles.progressBar}>
        <div style={styles.progressTrack}>
          {'['}
          <span style={styles.progressFill} className="flicker">
            {'▓▓▓▓▓▓▓▓░░░░░░░░'}
          </span>
          {']'}
        </div>
      </div>

      <div style={styles.statusLine}>
        ══════════════════════════════════
        <br />
        AWAITING DIVINE RESPONSE
        <br />
        ══════════════════════════════════
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
    background: 'var(--bg-primary)',
    padding: '2rem',
    fontFamily: 'var(--font-terminal)',
  },
  pattern: {
    color: 'var(--amber)',
    fontSize: '0.8rem',
    lineHeight: 1.2,
    textAlign: 'center',
    margin: 0,
    textShadow: '0 0 15px rgba(255, 176, 0, 0.5)',
    marginBottom: '2rem',
  },
  messageContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  prompt: {
    color: 'var(--amber-dim)',
    fontSize: '1rem',
  },
  message: {
    color: 'var(--amber)',
    fontSize: '0.9rem',
  },
  dots: {
    color: 'var(--amber)',
    fontSize: '0.9rem',
    width: '1.5em',
    display: 'inline-block',
  },
  progressBar: {
    marginBottom: '2rem',
  },
  progressTrack: {
    color: 'var(--amber-dim)',
    fontSize: '0.9rem',
    letterSpacing: '0.05em',
  },
  progressFill: {
    color: 'var(--amber)',
  },
  statusLine: {
    color: 'var(--text-dim)',
    fontSize: '0.7rem',
    textAlign: 'center',
    letterSpacing: '0.1em',
    lineHeight: 1.6,
  },
};
