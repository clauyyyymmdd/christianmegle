import { useMemo, type CSSProperties } from 'react';
import { renderProfile } from '../borders';

interface LaceLoadingProps {
  profile?: string;
  duration?: number; // total weave-in time in ms
  style?: CSSProperties;
}

const baseStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '9px',
  lineHeight: '9px',
  letterSpacing: 0,
  color: 'var(--lace)',
  whiteSpace: 'pre',
  pointerEvents: 'none',
  margin: 0,
  padding: 0,
};

export function LaceLoading({
  profile = 'hunchback-dense',
  duration = 2000,
  style,
}: LaceLoadingProps) {
  const ascii = useMemo(() => renderProfile(profile), [profile]);

  // Pre-compute spans with random delays so the lace knits itself in
  const spans = useMemo(() => {
    const out: { ch: string; delay: number; key: string }[] = [];
    let key = 0;
    for (const ch of ascii) {
      if (ch === '\n' || ch === ' ') {
        out.push({ ch, delay: 0, key: `n${key++}` });
      } else {
        out.push({ ch, delay: Math.random() * duration, key: `c${key++}` });
      }
    }
    return out;
  }, [ascii, duration]);

  return (
    <pre style={{ ...baseStyle, ...style }}>
      {spans.map(({ ch, delay, key }) =>
        ch === '\n' || ch === ' ' ? (
          ch === '\n' ? '\n' : ' '
        ) : (
          <span
            key={key}
            style={{
              opacity: 0,
              animation: `laceWeave 0.4s ease-out ${delay}ms forwards`,
            }}
          >
            {ch}
          </span>
        ),
      )}
    </pre>
  );
}
