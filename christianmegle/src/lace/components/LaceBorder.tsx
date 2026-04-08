import type { CSSProperties } from 'react';
import { useLaceBorder } from '../hooks/useLaceBorder';
import type { BorderConfig } from '../engine';

interface LaceBorderProps {
  profile?: string;
  config?: BorderConfig;
  style?: CSSProperties;
  className?: string;
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

export function LaceBorder({ profile, config, style, className }: LaceBorderProps) {
  const ascii = useLaceBorder(profile ?? config!);
  return (
    <pre style={{ ...baseStyle, ...style }} className={className}>
      {ascii}
    </pre>
  );
}
