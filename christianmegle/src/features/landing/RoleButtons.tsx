import { useNavigate } from 'react-router-dom';
import ChromeButton from '../../components/ChromeButton';

/**
 * The two primary CTAs on the landing page.
 */
export function RoleButtons() {
  const navigate = useNavigate();

  return (
    <div style={styles.roleContainer}>
      <ChromeButton onClick={() => navigate('/confess?role=priest')} title="forgive others">
        <span style={styles.labelStack}>
          <span style={styles.labelMain}>I am forgiven</span>
          <span style={styles.labelSub}>hear the confessions of others</span>
        </span>
      </ChromeButton>

      <ChromeButton onClick={() => navigate('/confess?role=sinner')} title="be forgiven">
        <span style={styles.labelStack}>
          <span style={styles.labelMain}>I am a sinner</span>
          <span style={styles.labelSub}>confess your sins</span>
        </span>
      </ChromeButton>
    </div>
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
    color: '#8b0000',
  },
  labelSub: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.6rem',
    fontWeight: 400,
    letterSpacing: '0.05em',
    opacity: 1,
    color: '#8b0000',
  },
};
