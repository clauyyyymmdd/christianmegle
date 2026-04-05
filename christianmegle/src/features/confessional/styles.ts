import type React from 'react';

export const screenStyles: Record<string, React.CSSProperties> = {
  centered: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    textAlign: 'center',
    background: 'var(--bg-primary)',
    fontFamily: 'var(--font-terminal)',
  },
  asciiWelcome: { color: 'var(--amber)', fontSize: '0.7rem', lineHeight: 1.3, margin: 0, textShadow: '0 0 15px var(--amber-glow)' },
  asciiPending: { color: 'var(--amber-dim)', fontSize: '0.7rem', lineHeight: 1.3, margin: 0 },
  asciiError: { color: 'var(--crimson)', fontSize: '0.7rem', lineHeight: 1.3, margin: 0, textShadow: '0 0 15px var(--crimson-glow)' },
  asciiWaiting: { color: 'var(--amber)', fontSize: '0.9rem', lineHeight: 1.2, margin: 0, textShadow: '0 0 15px var(--amber-glow)' },
  asciiComplete: { color: 'var(--amber)', fontSize: '0.7rem', lineHeight: 1.3, margin: 0 },
  welcomePrompt: { marginTop: '1.5rem', fontSize: '1.1rem', color: 'var(--amber)' },
  promptSymbol: { color: 'var(--amber-dim)' },
  priestNameHighlight: { color: 'var(--amber-bright)', textShadow: '0 0 20px var(--amber-glow)' },
  statusBox: { color: 'var(--amber-dim)', fontSize: '0.65rem', lineHeight: 1.4, margin: '1.5rem 0 0 0' },
  terminalDivider: { color: 'var(--amber-dim)', fontSize: '0.7rem', margin: '1.5rem 0', letterSpacing: '-0.1em' },
  transitionText: { fontFamily: 'var(--font-terminal)', fontSize: '0.85rem', color: 'var(--amber)' },
  statusText: { color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '1rem', lineHeight: 1.8, fontSize: '0.9rem' },
  positionText: { fontFamily: 'var(--font-terminal)', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--amber-dim)', marginTop: '1.5rem' },
};
