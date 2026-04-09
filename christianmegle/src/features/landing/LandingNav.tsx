import { useNavigate } from 'react-router-dom';

interface LandingNavProps {
  visible: boolean;
  lightMode: boolean;
  onToggleLightMode: () => void;
}

/**
 * Top-right nav row. Knows nothing about storage or the body class —
 * it just gets `lightMode` / `onToggleLightMode` from the gate hook.
 * Whitepaper click opens Ezekiel 16 in a new tab.
 */
export function LandingNav({ visible, lightMode, onToggleLightMode }: LandingNavProps) {
  const navigate = useNavigate();

  if (!visible) return null;

  const handleWhitepaper = () => {
    window.open(
      'https://www.biblegateway.com/passage/?search=Ezekiel+16&version=NIV',
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <div style={styles.navRow}>
      <span style={styles.navLink} onClick={() => navigate('/leaderboard')} title="leaderboard">
        leaderboard
      </span>
      <span style={styles.navLink} onClick={handleWhitepaper} title="coming soon">
        whitepaper
      </span>
      <span style={styles.navLink} onClick={() => navigate('/offering')} title="pls">
        offering
      </span>
      <span style={styles.navLink} onClick={() => navigate('/careers')} title="careers">
        careers
      </span>
      <span style={styles.navLink} onClick={onToggleLightMode}>
        {lightMode ? 'dark mode' : 'light mode'}
      </span>
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
};
