import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChromeButton from '../../components/ChromeButton';

/**
 * The two primary CTAs on the landing page. Priest click first shows a
 * modal communicating that authentication is required, then continues
 * into the existing priest flow where the examination lives.
 */
export function RoleButtons() {
  const navigate = useNavigate();
  const [showAuthNotice, setShowAuthNotice] = useState(false);

  return (
    <>
      <div style={styles.roleContainer}>
        <ChromeButton onClick={() => setShowAuthNotice(true)}>
          <span style={styles.labelStack}>
            <span style={styles.labelMain}>I am forgiven</span>
            <span style={styles.labelSub}>hear the confessions of others</span>
          </span>
        </ChromeButton>

        <ChromeButton onClick={() => navigate('/confess?role=sinner')}>
          <span style={styles.labelStack}>
            <span style={styles.labelMain}>I am a sinner</span>
            <span style={styles.labelSub}>confess your sins</span>
          </span>
        </ChromeButton>
      </div>

      {showAuthNotice && (
        <div style={styles.overlay} onClick={() => setShowAuthNotice(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalText}>you must be authenticated.</p>
            <div style={styles.modalButtons}>
              <button
                style={styles.modalButton}
                onClick={() => setShowAuthNotice(false)}
              >
                cancel
              </button>
              <button
                style={styles.modalButton}
                onClick={() => {
                  setShowAuthNotice(false);
                  navigate('/confess?role=priest');
                }}
              >
                continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  roleContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '0.75rem',
    width: '100%',
    animation: 'fadeIn 0.8s ease 1.6s both',
  },
  labelStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.15rem',
    lineHeight: 1.2,
  },
  labelMain: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    fontWeight: 500,
    letterSpacing: '0.04em',
    color: 'inherit',
  },
  labelSub: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.6rem',
    fontWeight: 400,
    letterSpacing: '0.05em',
    opacity: 0.7,
    color: 'inherit',
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
    textAlign: 'center',
    padding: '2rem 2.5rem',
    maxWidth: '380px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
  },
  modalText: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    color: 'var(--ivory)',
    margin: 0,
    lineHeight: 1.6,
  },
  modalButtons: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    marginTop: '1.5rem',
  },
  modalButton: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.7rem',
    letterSpacing: '0.05em',
    padding: '0.5rem 1rem',
    background: 'transparent',
    color: 'var(--ivory-dim)',
    border: '1px solid var(--border-subtle)',
    cursor: 'pointer',
  },
};
