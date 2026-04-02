import { screenStyles as s } from '../styles';

interface Props {
  onBecomeSinner: () => void;
}

export function NotSavedScreen({ onBecomeSinner }: Props) {
  return (
    <div style={s.centered} className="page-enter">
      <pre style={s.asciiError}>{`
╔══════════════════════════════════════╗
║            ⚠ ERROR ⚠                 ║
║      SALVATION NOT DETECTED          ║
╚══════════════════════════════════════╝
      `}</pre>
      <p style={s.statusText}>
        To prevent going to the TRUE wrong place, repent for your sins.
      </p>
      <div style={s.terminalDivider}>════════════════════════════</div>
      <p style={s.transitionText}>&gt; REDIRECTING TO CONFESSION MODE...</p>
      <button onClick={onBecomeSinner} style={{ marginTop: '1.5rem' }}>Repent as Sinner</button>
    </div>
  );
}
