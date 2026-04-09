import { AsciiLace } from '../lace';
import LoadingScreen from '../features/entry/LoadingScreen';
import { useLandingGate } from '../features/landing/useLandingGate';
import { LandingNav } from '../features/landing/LandingNav';
import { LandingHero } from '../features/landing/LandingHero';
import { LightModeDeniedModal } from '../features/landing/LightModeDeniedModal';

/**
 * Landing page composition. All storage, body-class, and modal state
 * lives in useLandingGate; all layout/copy lives in the feature
 * components. This file wires them together and owns nothing else
 * besides the page container + sparkle decoration.
 */
export default function Landing() {
  const {
    showEntry,
    dismissEntry,
    lightMode,
    toggleLightMode,
    showLightDenied,
    dismissLightDenied,
  } = useLandingGate();

  return (
    <>
      {showEntry && <LoadingScreen onComplete={dismissEntry} />}

      <div className="page-enter" style={styles.container}>
        <AsciiLace profile="landing" target="LaceFrame" />

        <LandingNav
          visible={!showEntry}
          lightMode={lightMode}
          onToggleLightMode={toggleLightMode}
        />

        {/* Y2K sparkle decorations */}
        <div style={styles.sparkleContainer}>
          <span style={{ ...styles.sparkle, top: '10%', left: '15%', animationDelay: '0s' }}>✦</span>
          <span style={{ ...styles.sparkle, top: '20%', right: '20%', animationDelay: '0.5s' }}>✧</span>
          <span style={{ ...styles.sparkle, top: '60%', left: '10%', animationDelay: '1s' }}>✦</span>
          <span style={{ ...styles.sparkle, top: '70%', right: '15%', animationDelay: '1.5s' }}>✧</span>
          <span style={{ ...styles.sparkle, top: '40%', left: '5%', animationDelay: '0.3s' }}>+</span>
          <span style={{ ...styles.sparkle, top: '30%', right: '8%', animationDelay: '0.8s' }}>+</span>
        </div>

        <LandingHero visible={!showEntry} />

        <span style={styles.footer}>made with devotion by claudia yile</span>
      </div>

      <LightModeDeniedModal open={showLightDenied} onClose={dismissLightDenied} />
    </>
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
  footer: {
    position: 'absolute',
    bottom: '0.6rem',
    fontFamily: 'var(--font-body)',
    fontSize: '0.45rem',
    letterSpacing: '0.06em',
    color: 'var(--ivory-dark)',
    opacity: 0.4,
  },
};
