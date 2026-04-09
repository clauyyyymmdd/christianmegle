interface LightModeDeniedModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "ACCESS DENIED" modal shown when a non-pardoned user tries to toggle
 * light mode. Pure UI — the gate hook decides when to show it.
 */
export function LightModeDeniedModal({ open, onClose }: LightModeDeniedModalProps) {
  if (!open) return null;

  return (
    <div style={styles.denialOverlay} onClick={onClose}>
      <div style={styles.denialModal} onClick={(e) => e.stopPropagation()}>
        <pre style={styles.denialAscii}>{`
╔══════════════════════════════════════╗
║           ACCESS DENIED              ║
╚══════════════════════════════════════╝
        `}</pre>
        <p style={styles.denialText}>
          You must be pardoned by a priest to see Heaven.
        </p>
        <button onClick={onClose} style={{ marginTop: '1.5rem' }}>
          Remain in Darkness
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  denialOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'var(--bg-overlay)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  denialModal: {
    textAlign: 'center',
    padding: '2rem',
    maxWidth: '420px',
  },
  denialAscii: {
    color: 'var(--crimson)',
    fontSize: '0.7rem',
    lineHeight: 1.3,
    margin: 0,
    textShadow: '0 0 15px var(--crimson-glow)',
  },
  denialText: {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    color: 'var(--ivory)',
    fontStyle: 'italic',
    lineHeight: 1.8,
    marginTop: '1.5rem',
  },
};
