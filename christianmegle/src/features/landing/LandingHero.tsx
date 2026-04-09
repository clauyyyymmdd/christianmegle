import { useState } from 'react';
import { brand, CrossLogo } from '../../assets';
import AboutModal from '../../components/AboutModal';
import { RoleButtons } from './RoleButtons';

interface LandingHeroProps {
  /** False while the splash is still up, true once dismissed. */
  visible: boolean;
}

/**
 * The centered brand stack: cross logo → wordmark → tagline → role CTAs.
 * Owns the AboutModal open state because the cross click is the only
 * thing that opens it. All children only mount when `visible` flips true
 * so their staged reveal animations fire at the right moment.
 */
export function LandingHero({ visible }: LandingHeroProps) {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="hero-glow" style={styles.hero}>
      {visible && (
        <>
          <div
            key="cross"
            style={styles.crossWrap}
            title="About Christianmegle"
          >
            <CrossLogo size={150} onClick={() => setShowAbout(true)} />
          </div>
          <img
            key="wordmark"
            src={brand.wordmark}
            alt="ChristianMegle"
            style={styles.wordmark}
          />
          <p style={styles.tagline}>Confess your sins to strangers</p>
          <RoleButtons />
        </>
      )}

      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
    fontFamily: 'var(--font-body)',
    fontStyle: 'normal',
    fontSize: '0.72rem',
    fontWeight: 400,
    color: 'var(--ivory-dim)',
    letterSpacing: '0.08em',
    margin: 0,
    textAlign: 'center',
    animation: 'fadeIn 0.8s ease 1.4s both',
  },
};
