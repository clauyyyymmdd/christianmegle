import { useEffect } from 'react';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
    >
      <div
        style={styles.frame}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Chrome title bar */}
        <div style={styles.titleBar}>
          <span id="about-title" style={styles.title}>How to use Christianmegle:</span>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">×</button>
        </div>

        {/* Dark content area */}
        <div style={styles.content}>
          <div style={styles.row}>
            <div style={styles.roleLabel}>FOR SINNERS:</div>
            <p style={styles.roleBody}>
              If you are unable to visit a church and confess your transgressions,
              it shows: your sins have stained you like scarlet. To go about with
              them still stuck inside you, rather than practicing regular repentance
              and confession, is the spiritual equivalent of never brushing your
              teeth or never relieving yourself. Everyone can tell.
            </p>
            <p style={styles.roleBody}>
              Christianmegle is your portable, on-the-go confession booth. Speak
              to a priest authenticated right here on Christianmegle. Our
              God-breathed, roulette-style algorithm matches you with the right
              person to hear your confession in real time. At any point during
              your session, you may switch priests and continue. Your priest will
              assign you penance, and your sins will be absolved. Now go forth
              and confess.
            </p>
          </div>

          <div style={styles.divider} />

          <div style={styles.row}>
            <div style={styles.roleLabel}>FOR PRIESTS:</div>
            <p style={styles.roleBody}>
              Priests, do you want practice hearing confessions and pardoning
              sins? Look no further. God will always find a way for you to do
              His work. With our simple authentication process, you can exercise
              the authority God gave you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '2rem',
    backdropFilter: 'blur(2px)',
    animation: 'aboutBackdropIn 0.3s ease forwards',
  },
  frame: {
    position: 'relative',
    width: '100%',
    maxWidth: '520px',
    // Chrome silver frame — matches the hero button gradient
    background: 'linear-gradient(180deg, #e8e8e8 0%, #d4d4d4 10%, #b8b8b8 30%, #a0a0a0 50%, #b0b0b0 70%, #c8c8c8 90%, #e0e0e0 100%)',
    borderRadius: '6px',
    padding: '3px',
    // 3D bevel: light top/left, dark bottom/right
    boxShadow:
      '0 0 0 1px #555, ' +
      '0 1px 0 rgba(255, 255, 255, 0.8) inset, ' +
      '0 -1px 0 rgba(0, 0, 0, 0.2) inset, ' +
      '0 20px 60px rgba(0, 0, 0, 0.7), ' +
      '0 0 40px rgba(200, 200, 220, 0.15)',
    animation: 'aboutFrameIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  titleBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.65rem 1rem',
    background: 'linear-gradient(180deg, #f0f0f0 0%, #c8c8c8 50%, #a8a8a8 100%)',
    borderRadius: '3px 3px 0 0',
    borderBottom: '1px solid #666',
  },
  title: {
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '0.78rem',
    fontWeight: 500,
    letterSpacing: '0.04em',
    color: '#1a1a1a',
    textShadow: '0 1px 0 rgba(255, 255, 255, 0.6)',
  },
  closeBtn: {
    width: '22px',
    height: '22px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #e0e0e0 0%, #b0b0b0 100%)',
    border: '1px solid #555',
    borderTopColor: '#eee',
    borderLeftColor: '#ddd',
    borderRadius: '2px',
    cursor: 'pointer',
    color: '#1a1a1a',
    fontSize: '14px',
    fontFamily: 'var(--font-terminal)',
    fontWeight: 700,
    lineHeight: 1,
    boxShadow:
      'inset 0 1px 0 rgba(255, 255, 255, 0.6), ' +
      '0 1px 2px rgba(0, 0, 0, 0.4)',
  },
  content: {
    background: '#0d0a0a',
    color: 'var(--ivory)',
    padding: '1.5rem 1.75rem 1.75rem',
    borderRadius: '0 0 3px 3px',
    border: '1px solid #333',
    borderTop: 'none',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #555, transparent)',
    margin: '1.25rem 0',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  roleLabel: {
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '0.8rem',
    fontWeight: 500,
    letterSpacing: '0.08em',
    color: '#e8e8e8',
    textShadow: '0 0 8px rgba(255, 255, 255, 0.2)',
  },
  roleBody: {
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '0.78rem',
    lineHeight: 1.7,
    color: 'var(--ivory-dim)',
    margin: 0,
  },
};
