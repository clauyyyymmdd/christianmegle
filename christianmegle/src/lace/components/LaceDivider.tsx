import type { CSSProperties } from 'react';
import { LaceBorder } from './LaceBorder';

interface LaceDividerProps {
  profile?: string;
  orientation?: 'vertical' | 'horizontal';
  style?: CSSProperties;
}

export function LaceDivider({
  profile = 'grate-divider',
  orientation = 'vertical',
  style,
}: LaceDividerProps) {
  const orientStyle: CSSProperties = orientation === 'horizontal'
    ? { writingMode: 'vertical-rl', transform: 'rotate(180deg)' }
    : {};

  return (
    <div style={{ display: 'inline-block', ...orientStyle, ...style }}>
      <LaceBorder profile={profile} />
    </div>
  );
}
