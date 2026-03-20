import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const bootSequence = [
  'LITURGICAL TERMINAL v2.0.26',
  '═══════════════════════════════════════════',
  '',
  'INITIALIZING CONFESSION PROTOCOL...',
  'LOADING SACRAMENTAL MODULES... OK',
  'ESTABLISHING SECURE CHANNEL TO HEAVEN... OK',
  'GRACE BUFFER: UNLIMITED',
  '',
  '═══════════════════════════════════════════',
];

export default function Landing() {
  const navigate = useNavigate();
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < bootSequence.length) {
        setBootLines(prev => [...prev, bootSequence[lineIndex]]);
        lineIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBootComplete(true), 300);
      }
    }, 120);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-enter" style={styles.container}>
      {/* Boot Sequence */}
      <div style={styles.bootContainer}>
        {bootLines.map((line, i) => (
          <div key={i} style={styles.bootLine} className="boot-line">
            {line}
          </div>
        ))}
      </div>

      {/* Main Content */}
      {bootComplete && (
        <div style={styles.mainContent}>
          {/* Logo */}
          <img
            src="/assets/images/logo.png"
            alt=""
            style={styles.logo}
          />
          {/* Wordmark */}
          <img
            src="/assets/images/wordmark.png"
            alt="ChristianMegle"
            style={styles.wordmark}
          />
          <p style={styles.tagline}>confess your sins to strangers</p>

          {/* Prompt */}
          <div style={styles.prompt}>
            <span style={styles.promptSymbol}>&gt;</span>
            <span style={styles.promptText}>SELECT YOUR ROLE:</span>
            <span className="cursor" />
          </div>

          {/* Role selection */}
          <div style={styles.roleContainer}>
            <button
              style={styles.roleButton}
              onClick={() => navigate('/confess?role=priest')}
            >
              <span style={styles.roleKey}>[1]</span>
              <span style={styles.roleLabel}>I HEAR CONFESSIONS</span>
              <span style={styles.roleDesc}>// priest mode</span>
            </button>

            <button
              style={styles.roleButton}
              onClick={() => navigate('/confess?role=sinner')}
            >
              <span style={styles.roleKey}>[2]</span>
              <span style={styles.roleLabel}>I SEEK FORGIVENESS</span>
              <span style={styles.roleDesc}>// sinner mode</span>
            </button>
          </div>

          <div style={styles.statusBar}>
            ╔══════════════════════════════════════════════════════╗
            <br />
            ║ STATUS: READY │ PRIESTS ONLINE: ∞ │ GRACE: AVAILABLE ║
            <br />
            ╚══════════════════════════════════════════════════════╝
          </div>
        </div>
      )}
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
    background: 'var(--bg-primary)',
  },
  bootContainer: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.85rem',
    color: 'var(--amber)',
    textAlign: 'left',
    width: '100%',
    maxWidth: '500px',
    marginBottom: '2rem',
  },
  bootLine: {
    marginBottom: '0.25rem',
    opacity: 0,
    animation: 'bootLine 0.2s ease forwards',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    animation: 'fadeIn 0.5s ease forwards',
  },
  logo: {
    width: '80px',
    height: 'auto',
    filter: 'drop-shadow(0 0 15px rgba(255, 176, 0, 0.4))',
    marginBottom: '1rem',
  },
  wordmark: {
    maxWidth: '400px',
    width: '100%',
    height: 'auto',
    filter: 'drop-shadow(0 0 20px rgba(255, 176, 0, 0.3))',
    marginBottom: '0.5rem',
  },
  tagline: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.9rem',
    color: 'var(--amber-dim)',
    letterSpacing: '0.15em',
    textTransform: 'lowercase',
    margin: 0,
  },
  prompt: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '2rem',
    marginBottom: '1.5rem',
    fontFamily: 'var(--font-terminal)',
    fontSize: '1rem',
  },
  promptSymbol: {
    color: 'var(--amber-dim)',
  },
  promptText: {
    color: 'var(--amber)',
  },
  roleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    maxWidth: '400px',
  },
  roleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.5rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--amber-dim)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  roleKey: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.9rem',
    color: 'var(--amber-bright)',
  },
  roleLabel: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.9rem',
    color: 'var(--amber)',
    flex: 1,
  },
  roleDesc: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
  },
  statusBar: {
    marginTop: '3rem',
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.7rem',
    color: 'var(--amber-dim)',
    textAlign: 'center',
    lineHeight: 1.4,
  },
};
