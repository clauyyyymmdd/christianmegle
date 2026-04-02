import { screenStyles as s } from '../styles';

interface Props {
  onBecomeSinner: () => void;
}

export function StillASinnerScreen({ onBecomeSinner }: Props) {
  return (
    <div style={s.centered} className="page-enter">
      <pre style={s.asciiError}>{`
╔══════════════════════════════════════╗
║         ACCESS DENIED                ║
║   INSUFFICIENT SCRIPTURE KNOWLEDGE   ║
╚══════════════════════════════════════╝
      `}</pre>
      <p style={s.statusText}>
        You have not demonstrated sufficient knowledge of scripture to serve as a priest.
      </p>
      <div style={s.terminalDivider}>════════════════════════════</div>
      <p style={s.transitionText}>&gt; REASSIGNING ROLE: SINNER</p>
      <button onClick={onBecomeSinner} style={{ marginTop: '1.5rem' }}>Enter as Sinner</button>
    </div>
  );
}
