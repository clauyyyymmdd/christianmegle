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
      {/* Wordmark */}
      <img
        src="/assets/images/wordmark.png"
        alt="ChristianMegle"
        style={styles.wordmark}
      />

      <p style={styles.tagline}>Confess your sins to strangers.</p>

      {/* Divider */}
      <div className="divider" style={{ width: '300px' }}>
        <span className="cross">✝</span>
      </div>

      {/* Role selection */}
      <div style={styles.roleContainer}>
        <button
          style={styles.roleButton}
          onClick={() => navigate('/confess?role=priest')}
        >
          <span style={styles.roleTitle}>I Hear Confessions</span>
          <span style={styles.roleSubtitle}>Enter as Priest</span>
        </button>

        <button
          style={styles.roleButton}
          onClick={() => navigate('/confess?role=sinner')}
        >
          <span style={styles.roleTitle}>I Seek Forgiveness</span>
          <span style={styles.roleSubtitle}>Enter as Sinner</span>
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
    background: 'var(--bg-primary)',
  },
  bootInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '2rem',
    border: '1px solid var(--blood-dim)',
    background: 'rgba(0,0,0,0.3)',
    minWidth: '320px',
  },
  bootLabel: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.7rem',
    color: 'var(--blood)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginBottom: '1rem',
  },
  bootItems: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.25rem',
    maxWidth: '400px',
    width: '100%',
  },
  bootItem: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.85rem',
    color: 'var(--ivory-dim)',
    letterSpacing: '0.02em',
  },
  revealContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkReveal: {
    maxWidth: '450px',
    width: '85%',
    height: 'auto',
    animation: 'wordmarkReveal 1.2s ease-out forwards, wordmarkGlow 3s ease-in-out infinite 1.2s',
  },
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: `
      radial-gradient(ellipse at 50% 0%, rgba(139, 0, 0, 0.15) 0%, transparent 50%),
      var(--bg-primary)
    `,
  },
  wordmark: {
    maxWidth: '450px',
    width: '85%',
    height: 'auto',
    marginBottom: '0.5rem',
  },
  tagline: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '1.1rem',
    color: 'var(--ivory-dim)',
    letterSpacing: '0.05em',
    marginTop: '0.5rem',
  },
  roleContainer: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  roleButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1.5rem 2.5rem',
    minWidth: '200px',
  },
  roleTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.95rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  roleSubtitle: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '0.85rem',
    color: 'var(--ivory-dim)',
    textTransform: 'none',
    letterSpacing: 'normal',
  },
  leaderboardLink: {
    marginTop: '2rem',
    background: 'transparent',
    border: 'none',
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '0.9rem',
    color: 'var(--blood-bright)',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  },
};
