import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const [hoveredRole, setHoveredRole] = useState<'priest' | 'sinner' | null>(null);

  return (
    <div className="page-enter" style={styles.container}>
      {/* Background texture */}
      <div style={styles.bgTexture} />

      {/* Header */}
      <div style={styles.header}>
        <div className="cross" style={styles.crossTop}>✝</div>
        <h1 style={styles.title}>ChristianMegle</h1>
        <p style={styles.subtitle}>confess your sins to strangers</p>
      </div>

      {/* Divider */}
      <div className="divider">
        <span className="cross">✦</span>
      </div>

      {/* Role selection */}
      <div style={styles.roleContainer}>
        <button
          style={{
            ...styles.roleButton,
            ...(hoveredRole === 'priest' ? styles.roleButtonHovered : {}),
          }}
          onMouseEnter={() => setHoveredRole('priest')}
          onMouseLeave={() => setHoveredRole(null)}
          onClick={() => navigate('/confess?role=priest')}
        >
          <span style={styles.roleIcon}>☦</span>
          <span style={styles.roleLabel}>I am a Priest</span>
          <span style={styles.roleDesc}>Hear the confessions of sinners</span>
        </button>

        <div style={styles.orDivider}>
          <span style={styles.orText}>or</span>
        </div>

        <button
          style={{
            ...styles.roleButton,
            ...(hoveredRole === 'sinner' ? styles.roleButtonHovered : {}),
          }}
          onMouseEnter={() => setHoveredRole('sinner')}
          onMouseLeave={() => setHoveredRole(null)}
          onClick={() => navigate('/confess?role=sinner')}
        >
          <span style={styles.roleIcon}>🕯</span>
          <span style={styles.roleLabel}>I am a Sinner</span>
          <span style={styles.roleDesc}>Confess and be saved</span>
        </button>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          "If we confess our sins, he is faithful and just to forgive us our sins,
          and to cleanse us from all unrighteousness."
        </p>
        <p style={styles.footerCite}>— 1 John 1:9</p>
      </div>
    </div>
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
  },
  bgTexture: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(ellipse at 50% 0%, rgba(107, 28, 35, 0.15) 0%, transparent 60%),
      radial-gradient(ellipse at 50% 100%, rgba(201, 168, 76, 0.05) 0%, transparent 40%),
      var(--bg-primary)
    `,
    zIndex: -1,
  },
  header: {
    textAlign: 'center',
    marginBottom: '1rem',
  },
  crossTop: {
    fontSize: '2rem',
    marginBottom: '1rem',
    display: 'block',
  },
  title: {
    fontSize: '3.5rem',
    letterSpacing: '0.12em',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    fontSize: '1.1rem',
    letterSpacing: '0.05em',
    textTransform: 'none' as const,
    textAlign: 'center',
  },
  roleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    marginTop: '2rem',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  roleButton: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.75rem',
    padding: '2.5rem 3rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--gold-dim)',
    cursor: 'pointer',
    transition: 'all 0.5s ease',
    minWidth: '220px',
  },
  roleButtonHovered: {
    borderColor: 'var(--gold)',
    boxShadow: '0 0 40px rgba(201, 168, 76, 0.08), inset 0 0 40px rgba(201, 168, 76, 0.03)',
  },
  roleIcon: {
    fontSize: '2rem',
  },
  roleLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--gold)',
  },
  roleDesc: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    textTransform: 'none' as const,
    letterSpacing: 'normal',
  },
  orDivider: {
    display: 'flex',
    alignItems: 'center',
  },
  orText: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    color: 'var(--text-dim)',
    fontSize: '1rem',
  },
  footer: {
    marginTop: '4rem',
    textAlign: 'center',
    maxWidth: '500px',
  },
  footerText: {
    fontStyle: 'italic',
    color: 'var(--text-dim)',
    fontSize: '0.9rem',
    lineHeight: 1.8,
  },
  footerCite: {
    color: 'var(--gold-dim)',
    fontSize: '0.8rem',
    marginTop: '0.5rem',
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.05em',
  },
};
