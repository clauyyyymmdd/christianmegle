import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { brand, CrossLogo } from '../assets';
import ChromeButton from '../components/ChromeButton';
import AboutModal from '../components/AboutModal';
import { LaceFrame } from '../lace';
import LoadingScreen from '../features/entry/LoadingScreen';

export default function Landing() {
  const navigate = useNavigate();
  const [showEntry, setShowEntry] = useState(() =>
    typeof window !== 'undefined' && !sessionStorage.getItem('christianmegle_entered')
  );
  const [showLightDenied, setShowLightDenied] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
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
    <>
      {showEntry && (
        <LoadingScreen
          onComplete={() => {
            sessionStorage.setItem('christianmegle_entered', '1');
            setShowEntry(false);
          }}
        />
      )}
      <div className="page-enter" style={styles.container}>
        <LaceFrame profile="landing-hero" />

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

      {/* Hero stack — everything centered in one column.
          Cross + wordmark only mount once the entry overlay is gone,
          so their CSS animations play visibly instead of behind the overlay. */}
      <div className="hero-glow" style={styles.hero}>
        {!showEntry && (
          <>
            <div key="cross" style={styles.crossWrap}>
              <CrossLogo size={150} onClick={() => setShowAbout(true)} />
            </div>
            <img
              key="wordmark"
              src={brand.wordmark}
              alt="ChristianMegle"
              style={styles.wordmark}
            />
          </>
        )}

        <p style={styles.tagline}>Confess your sins to strangers</p>

        {/* Role selection - Chrome Sprite Buttons */}
        <div style={styles.roleContainer}>
          <ChromeButton onClick={() => navigate('/confess?role=priest')}>
            I AM FORGIVEN
          </ChromeButton>

          <ChromeButton onClick={() => navigate('/confess?role=sinner')}>
            ✝ I HAVE SINNED ✝
          </ChromeButton>
        </div>
      </div>
      </div>

      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
    </>
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
    background: 'var(--bg-overlay)',
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
    textShadow: '0 0 15px var(--crimson-glow)',
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
    background: 'var(--bg-primary)',
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
    color: 'var(--ivory-dim)',
    fontSize: '1.2rem',
    animation: 'twinkle 2s ease-in-out infinite',
  },
  hero: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '480px',
    gap: '1rem',
  },
  crossWrap: {
    width: '150px',
    marginBottom: '0.25rem',
    animation: 'crossDescend 1.4s ease-out 0.2s both',
  },
  wordmark: {
    width: '100%',
    maxWidth: '450px',
    height: 'auto',
    display: 'block',
    filter: 'drop-shadow(0 0 30px var(--blood-glow))',
    animation: 'wordmarkLoad 1.6s ease-out 0.6s both',
  },
  tagline: {
    fontFamily: 'var(--font-title)',
    fontStyle: 'normal',
    fontSize: '0.75rem',
    color: 'var(--ivory-dim)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    margin: 0,
    textAlign: 'center',
  },
  roleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '0.75rem',
    width: '100%',
  },
  heroButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '1.2rem 2rem',
    width: '100%',
    borderRadius: '6px',
    transform: 'none',
  },
  heroTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
  },
  heroSub: {
    fontSize: '0.65rem',
    fontWeight: 400,
    letterSpacing: '0.05em',
    opacity: 0.7,
    textTransform: 'none',
  },
};
