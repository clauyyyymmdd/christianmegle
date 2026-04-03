import { screenStyles as s } from '../styles';

interface Props {
  priestName: string | null;
  onEnter: () => void;
  onStartOver: () => void;
}

export function WelcomeBackScreen({ priestName, onEnter, onStartOver }: Props) {
  return (
    <div style={s.centered} className="page-enter">
      <pre style={s.asciiWelcome}>{`
╔══════════════════════════════════════╗
║                                      ║
║          CREDENTIALS VALID           ║
║                                      ║
╚══════════════════════════════════════╝
      `}</pre>
      <div style={s.welcomePrompt}>
        <span style={s.promptSymbol}>&gt; </span>
        <span>WELCOME BACK, </span>
        <span style={s.priestNameHighlight}>{priestName || 'FATHER'}</span>
      </div>
      <p style={s.statusText}>Your ordination remains valid. You may hear confessions.</p>
      <pre style={s.statusBox}>{`
┌─────────────────────────────────┐
│ STATUS: APPROVED                │
│ ROLE: PRIEST                    │
│ GRACE: ACTIVE                   │
└─────────────────────────────────┘
      `}</pre>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <button onClick={onEnter}>Enter Confessional</button>
        <button onClick={onStartOver} style={{ opacity: 0.6 }}>New Identity</button>
      </div>
    </div>
  );
}
