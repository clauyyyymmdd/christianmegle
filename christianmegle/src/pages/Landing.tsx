import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

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
            {currentLabel && (
              <p style={styles.bootLabel}>{currentLabel}</p>
            )}
            <div style={styles.bootItems}>
              {visibleItems.map((item, i) => (
                <span key={i} style={styles.bootItem} className="boot-line">
                  <span style={{ color: 'var(--blood)', marginRight: '0.5rem' }}>›</span>
                  {item}
                </span>
              ))}
            </div>
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

      <p style={styles.tagline}>✧ Confess your sins to strangers ✧</p>

      {/* Divider */}
      <div className="divider" style={{ width: '300px' }}>
        <span className="cross" style={{ fontSize: '1.5rem' }}>✝</span>
      </div>

      {/* Role selection */}
      <div style={styles.roleContainer}>
        <button
          style={styles.roleButton}
          onClick={() => navigate('/confess?role=priest')}
        >
          <span style={styles.roleTitle}>I AM A PRIEST</span>
          <span style={styles.roleSubtitle}>hear the confessions of sinners</span>
        </button>

        <button
          style={styles.roleButton}
          onClick={() => navigate('/confess?role=sinner')}
        >
          <span style={styles.roleTitle}>I AM A SINNER</span>
          <span style={styles.roleSubtitle}>confess to a stranger</span>
        </button>
      </div>

      <button
        style={styles.leaderboardLink}
        onClick={() => navigate('/leaderboard')}
      >
        View the Book of Life
      </button>
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
    padding: '2rem 2.5rem',
    border: '2px solid',
    borderColor: 'rgba(255,255,255,0.2) rgba(100,100,100,0.3) rgba(80,80,80,0.3) rgba(200,200,200,0.2)',
    background: 'linear-gradient(135deg, rgba(30,30,40,0.8) 0%, rgba(20,20,25,0.9) 100%)',
    minWidth: '320px',
    boxShadow: '0 0 30px rgba(100, 80, 150, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
    borderRadius: '4px',
  },
  bootLabel: {
    fontFamily: 'var(--font-title)',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--ivory-dim)',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    marginBottom: '1.5rem',
  },
  bootItems: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.4rem',
    maxWidth: '400px',
    width: '100%',
  },
  bootItem: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '1rem',
    color: 'var(--ivory)',
    letterSpacing: '0.01em',
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
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '1.3rem',
    color: 'var(--ivory)',
    letterSpacing: '0.02em',
    marginTop: '0.5rem',
  },
  roleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1.5rem',
    width: '100%',
    maxWidth: '500px',
  },
  roleButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '1.25rem 3rem',
    width: '100%',
    borderRadius: '12px',
  },
  roleTitle: {
    fontFamily: 'var(--font-title)',
    fontSize: '1.1rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#333',
    textShadow: '0 1px 0 rgba(255, 255, 255, 0.6)',
  },
  roleSubtitle: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '1rem',
    color: '#555',
    textTransform: 'none',
    letterSpacing: '0.02em',
    textShadow: '0 1px 0 rgba(255, 255, 255, 0.4)',
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
};
