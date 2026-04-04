import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, CSSProperties } from 'react';

const bootCategories = [
  {
    label: 'Loading Fruits of the Spirit...',
    items: ['Love', 'Joy', 'Peace', 'Patience', 'Kindness', 'Goodness', 'Faithfulness', 'Gentleness', 'Self-Control'],
  },
  {
    label: 'Loading Armor of God...',
    items: ['Belt of Truth', 'Breastplate of Righteousness', 'Gospel of Peace', 'Shield of Faith', 'Helmet of Salvation', 'Sword of the Spirit'],
  },
  {
    label: 'Loading Beatitudes...',
    items: ['Poor in Spirit', 'Those Who Mourn', 'The Meek', 'Hunger for Righteousness', 'The Merciful', 'Pure in Heart', 'The Peacemakers', 'The Persecuted'],
  },
  {
    label: 'Loading Seven Deadly Sins...',
    items: ['Pride', 'Greed', 'Lust', 'Envy', 'Gluttony', 'Wrath', 'Sloth'],
  },
];

// Pick one random category
const bootSequence = bootCategories[Math.floor(Math.random() * bootCategories.length)];

type BootPhase = 'loading' | 'reveal' | 'complete';

export default function Landing() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<BootPhase>('loading');
  const [visibleItems, setVisibleItems] = useState<string[]>([]);
  const [currentLabel] = useState(bootSequence.label);
  const timeoutRef = useRef<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState<'priest' | 'sinner' | 'leaderboard' | null>(null);

  useEffect(() => {
    if (phase !== 'loading') return;

    let itemIndex = 0;

    const showNextItem = () => {
      if (itemIndex < bootSequence.items.length) {
        setVisibleItems(prev => [...prev, bootSequence.items[itemIndex]]);
        itemIndex++;
        timeoutRef.current = window.setTimeout(showNextItem, 120);
      } else {
        // Pause then reveal wordmark
        timeoutRef.current = window.setTimeout(() => {
          setPhase('reveal');
          setTimeout(() => setPhase('complete'), 1500);
        }, 600);
      }
    };

    timeoutRef.current = window.setTimeout(showNextItem, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [phase]);

  if (phase !== 'complete') {
    return (
      <div style={styles.bootContainer}>
        {phase === 'loading' && (
          <div style={styles.bootInner}>
            <pre style={styles.bootHeader}>{`
┌─────────────────────────────────────┐
│  C H R I S T I A N M E G L E        │
│  ═══════════════════════════════    │`}</pre>
            {currentLabel && (
              <p style={styles.bootLabel}>│  {currentLabel}</p>
            )}
            <div style={styles.bootItems}>
              {visibleItems.map((item, i) => (
                <span key={i} style={styles.bootItem} className="boot-line">
                  │  › {item}
                </span>
              ))}
            </div>
            <pre style={styles.bootFooter}>{`└─────────────────────────────────────┘`}</pre>
          </div>
        )}
        {phase === 'reveal' && (
          <div style={styles.revealContainer}>
            <img
              src="/assets/images/wordmark.png"
              alt="ChristianMegle"
              style={styles.wordmarkReveal}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-enter" style={styles.container}>
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
│       ☦  I  A M  A  P R I E S T  ☦   │
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
│       ✝  I  A M  A  S I N N E R  ✝   │
│                                      │
│        confess to a stranger         │
│                                      │
└──────────────────────────────────────┘`}</pre>
        </div>
      </div>

      <div
        style={{
          ...styles.terminalLink,
          ...(hoveredButton === 'leaderboard' ? styles.terminalLinkHover : {}),
        } as CSSProperties}
        onClick={() => navigate('/leaderboard')}
        onMouseEnter={() => setHoveredButton('leaderboard')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        {'>'} View the Book of Life _
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bootContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: `
      radial-gradient(ellipse at 50% 50%, rgba(40, 30, 60, 0.3) 0%, transparent 50%),
      linear-gradient(180deg, #08080c 0%, #0a0a0f 50%, #080808 100%)
    `,
  },
  bootInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    background: 'rgba(0, 0, 0, 0.7)',
    minWidth: '380px',
  },
  bootHeader: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    lineHeight: 1.3,
    color: 'var(--ivory-dim)',
    margin: 0,
  },
  bootFooter: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    lineHeight: 1.3,
    color: 'var(--ivory-dim)',
    margin: 0,
  },
  bootLabel: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    color: 'var(--ivory-dim)',
    margin: '0.25rem 0',
  },
  bootItems: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.2rem',
    width: '100%',
  },
  bootItem: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    color: 'var(--ivory)',
  },
  revealContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wordmarkReveal: {
    maxWidth: '450px',
    width: '85%',
    height: 'auto',
    animation: 'wordmarkReveal 1.2s ease-out forwards, wordmarkGlow 3s ease-in-out infinite 1.2s',
    filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 80px rgba(139, 0, 0, 0.4))',
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
  roleButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '1.25rem 3rem',
    width: '100%',
  },
  roleTitle: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '1rem',
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    color: 'var(--ivory)',
  },
  roleSubtitle: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '0.9rem',
    color: 'var(--ivory-dim)',
    textTransform: 'none',
    letterSpacing: '0.02em',
  },
  leaderboardLink: {
    marginTop: '2.5rem',
    background: 'transparent',
    border: '2px solid var(--ivory-dim)',
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '1rem',
    color: 'var(--ivory)',
    cursor: 'pointer',
    padding: '0.75rem 2rem',
    boxShadow: 'none',
    textShadow: 'none',
    letterSpacing: '0.02em',
    textTransform: 'none',
  },
  terminalLink: {
    marginTop: '2rem',
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.85rem',
    color: 'var(--ivory-dim)',
    cursor: 'pointer',
    padding: '0.5rem 1rem',
    transition: 'all 0.2s ease',
    zIndex: 1,
  },
  terminalLinkHover: {
    color: 'var(--ivory)',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
  },
};
