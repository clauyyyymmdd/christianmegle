import type { CSSProperties } from 'react';
import { LaceBorder } from './LaceBorder';

interface LaceFrameProps {
  profile: string;
  style?: CSSProperties;
}

const wrapperStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'lacePulse 8s ease-in-out infinite',
};

export function LaceFrame({ profile, style }: LaceFrameProps) {
  return (
    <div style={{ ...wrapperStyle, ...style }}>
      <LaceBorder profile={profile} />
    </div>
  );
}
