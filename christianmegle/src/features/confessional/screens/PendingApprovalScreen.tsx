import { screenStyles as s } from '../styles';

interface Props {
  onStartOver: () => void;
}

export function PendingApprovalScreen({ onStartOver }: Props) {
  return (
    <div style={s.centered} className="page-enter">
      <pre style={s.asciiPending}>{`
╔══════════════════════════════════════╗
║       APPLICATION SUBMITTED          ║
║                                      ║
║     ▓▓▓▓▓▓▓▓░░░░░░░░  50%           ║
╚══════════════════════════════════════╝
      `}</pre>
      <p style={s.statusText}>
        Your application to serve as a priest is being reviewed.
        <br />Auto-approval in progress...
      </p>
      <div className="flicker" style={{ marginTop: '1.5rem', color: 'var(--amber)' }}>▓▓▓░░░</div>
      <button onClick={onStartOver} style={{ marginTop: '2rem', opacity: 0.5 }}>Start Over</button>
    </div>
  );
}
