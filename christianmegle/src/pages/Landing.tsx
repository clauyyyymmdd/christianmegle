import { useNavigate } from 'react-router-dom';
import { useState, CSSProperties } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState<'priest' | 'sinner' | null>(null);
  const [showLightDenied, setShowLightDenied] = useState(false);
  const [lightMode, setLightMode] = useState(() =>
    document.body.classList.contains('light-mode')
  );

  const handleLightMode = () => {
    const pardoned = localStorage.getItem('christianmegle_pardoned') === 'true';
    if (!pardoned) {
      setShowLightDenied(true);
      return;
    }
    const next = !lightMode;
    document.body.classList.toggle('light-mode', next);
    setLightMode(next);
  };

  return (
    <div className="page-enter" style={styles.container}>
      {/* Nav links — top right */}
      <div style={styles.navRow}>
        <span style={styles.navLink} onClick={() => navigate('/leaderboard')}>leaderboard</span>
        <span style={styles.navLink} onClick={() => navigate('/whitepaper')}>whitepaper</span>
        <span style={styles.navLink} onClick={() => navigate('/offering')}>offering</span>
        <span style={styles.navLink} onClick={() => navigate('/careers')}>careers</span>
        <span style={styles.navLink} onClick={handleLightMode}>
          {lightMode ? 'dark mode' : 'light mode'}
        </span>
      </div>

      {/* Light mode denial */}
      {showLightDenied && (
        <div style={styles.denialOverlay} onClick={() => setShowLightDenied(false)}>
          <div style={styles.denialModal} onClick={(e) => e.stopPropagation()}>
            <pre style={styles.denialAscii}>{`
╔══════════════════════════════════════╗
║           ACCESS DENIED              ║
╚══════════════════════════════════════╝
            `}</pre>
            <p style={styles.denialText}>
              You must be pardoned by a priest to see Heaven.
            </p>
            <button onClick={() => setShowLightDenied(false)} style={{ marginTop: '1.5rem' }}>
              Remain in Darkness
            </button>
          </div>
        </div>
      )}

      {/* Y2K Sparkle decorations */}
      <div style={styles.sparkleContainer}>
        <span style={{ ...styles.sparkle, top: '10%', left: '15%', animationDelay: '0s' }}>✦</span>
        <span style={{ ...styles.sparkle, top: '20%', right: '20%', animationDelay: '0.5s' }}>✧</span>
        <span style={{ ...styles.sparkle, top: '60%', left: '10%', animationDelay: '1s' }}>✦</span>
        <span style={{ ...styles.sparkle, top: '70%', right: '15%', animationDelay: '1.5s' }}>✧</span>
        <span style={{ ...styles.sparkle, top: '40%', left: '5%', animationDelay: '0.3s' }}>+</span>
        <span style={{ ...styles.sparkle, top: '30%', right: '8%', animationDelay: '0.8s' }}>+</span>
      </div>

      {/* Wordmark */}
      <img
        src="/assets/images/wordmark.png"
        alt="ChristianMegle"
        style={styles.wordmark}
        className="y2k-float"
      />

      <p style={styles.tagline}>Confess your sins to strangers</p>

      {/* Divider */}
      <div className="divider" style={{ width: '300px' }}>
        <span className="cross" style={{ fontSize: '1.5rem' }}>✝</span>
      </div>

      {/* Role selection - Terminal Style */}
      <div style={styles.roleContainer}>
        <div
          style={styles.terminalButton}
          onClick={() => navigate('/confess?role=priest')}
          onMouseEnter={() => setHoveredButton('priest')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <pre style={{
            ...styles.asciiFrame,
            ...(hoveredButton === 'priest' ? styles.asciiFrameHover : {}),
          } as CSSProperties}>{`
┌──────────────────────────────────────┐
│                                      │
│            I  AM FORGIVEN            │
│                                      │
│     hear the confessions of sinners  │
│                                      │
└──────────────────────────────────────┘`}</pre>
        </div>

        <div
          style={styles.terminalButton}
          onClick={() => navigate('/confess?role=sinner')}
          onMouseEnter={() => setHoveredButton('sinner')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <pre style={{
            ...styles.asciiFrame,
            ...(hoveredButton === 'sinner' ? styles.asciiFrameHover : {}),
          } as CSSProperties}>{`
┌──────────────────────────────────────┐
│                                      │
│       ✝  I  HAVE SINNED  ✝          │
│                                      │
│        confess to a stranger         │
│                                      │
└──────────────────────────────────────┘`}</pre>
        </div>
      </div>

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  navRow: {
    position: 'absolute',
    top: '1.2rem',
    right: '1.5rem',
    display: 'flex',
    gap: '1.5rem',
    zIndex: 10,
  },
  navLink: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.65rem',
    letterSpacing: '0.1em',
    color: 'var(--ivory-dim)',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },
  denialOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  denialModal: {
    textAlign: 'center',
    padding: '2rem',
    maxWidth: '420px',
  },
  denialAscii: {
    color: 'var(--crimson)',
    fontSize: '0.7rem',
    lineHeight: 1.3,
    margin: 0,
    textShadow: '0 0 15px rgba(139, 30, 38, 0.5)',
  },
  denialText: {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    color: 'var(--ivory)',
    fontStyle: 'italic',
    lineHeight: 1.8,
    marginTop: '1.5rem',
  },
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden',
    background: `
      radial-gradient(ellipse at 30% 20%, rgba(80, 60, 120, 0.15) 0%, transparent 40%),
      radial-gradient(ellipse at 70% 80%, rgba(139, 0, 0, 0.12) 0%, transparent 40%),
      radial-gradient(ellipse at 50% 50%, rgba(60, 60, 80, 0.1) 0%, transparent 60%),
      linear-gradient(180deg, #0a0a0f 0%, #0d0a0a 50%, #0a0808 100%)
    `,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  sparkle: {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '1.2rem',
    animation: 'twinkle 2s ease-in-out infinite',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(200, 180, 255, 0.5)',
  },
  wordmark: {
    maxWidth: '450px',
    width: '85%',
    height: 'auto',
    marginBottom: '0.5rem',
    position: 'relative',
    zIndex: 1,
    filter: 'drop-shadow(0 0 30px rgba(139, 0, 0, 0.4)) drop-shadow(0 0 60px rgba(100, 50, 150, 0.2))',
  },
  tagline: {
    fontFamily: 'var(--font-title)',
    fontStyle: 'normal',
    fontSize: '0.75rem',
    color: 'var(--ivory-dim)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginTop: '0.5rem',
  },
  roleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginTop: '1.5rem',
    width: '100%',
    maxWidth: '500px',
    zIndex: 1,
  },
  terminalButton: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  asciiFrame: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    lineHeight: 1.3,
    color: 'var(--ivory-dim)',
    margin: 0,
    padding: '0.5rem',
    background: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
    transition: 'all 0.2s ease',
  },
  asciiFrameHover: {
    color: 'var(--ivory)',
    background: 'rgba(20, 15, 25, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    textShadow: '0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(139, 0, 0, 0.3)',
    boxShadow: '0 0 30px rgba(139, 0, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.05)',
  },
};
