import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingNavProps {
  visible: boolean;
  lightMode: boolean;
  onToggleLightMode: () => void;
}

/**
 * Top-right nav row. Knows nothing about storage or the body class —
 * it just gets `lightMode` / `onToggleLightMode` from the gate hook.
 * Whitepaper click pops a "coming soon" notice and opens Ezekiel 16
 * in a new tab.
 */
export function LandingNav({ visible, lightMode, onToggleLightMode }: LandingNavProps) {
  const navigate = useNavigate();
  const [showWhitepaperNotice, setShowWhitepaperNotice] = useState(false);

  if (!visible) return null;

  const handleWhitepaper = () => {
    // Open the scripture reference first so the click is directly
    // connected to the popup (most browsers only allow window.open
    // during a trusted click handler).
    window.open(
      'https://www.biblegateway.com/passage/?search=Ezekiel+16&version=NIV',
      '_blank',
      'noopener,noreferrer',
    );
    setShowWhitepaperNotice(true);
  };

  return (
    <>
      <div style={styles.navRow}>
        <span style={styles.navLink} onClick={() => navigate('/leaderboard')}>
          leaderboard
        </span>
        <span style={styles.navLink} onClick={handleWhitepaper}>
          whitepaper
        </span>
        <span style={styles.navLink} onClick={() => navigate('/offering')}>
          offering
        </span>
        <span style={styles.navLink} onClick={() => navigate('/careers')}>
          careers
        </span>
        <span style={styles.navLink} onClick={onToggleLightMode}>
          {lightMode ? 'dark mode' : 'light mode'}
        </span>
      </div>

      {showWhitepaperNotice && (
        <div
          style={styles.overlay}
          onClick={() => setShowWhitepaperNotice(false)}
        >
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalText}>coming soon</p>
          </div>
        </div>
      )}
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
    animation: 'fadeIn 0.8s ease 1.8s both',
  },
  navLink: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.65rem',
    letterSpacing: '0.05em',
    color: 'var(--ivory-dim)',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'var(--bg-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1500,
  },
  modal: {
    padding: '2rem 2.5rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    textAlign: 'center',
  },
  modalText: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    color: 'var(--ivory)',
    margin: 0,
    letterSpacing: '0.05em',
  },
};
