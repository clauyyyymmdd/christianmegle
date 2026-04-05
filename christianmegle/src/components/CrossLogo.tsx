import { useState } from 'react';

interface CrossLogoProps {
  size?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function CrossLogo({ size = 80, onClick, style }: CrossLogoProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Base */}
      <img
        src="/assets/images/LOGO.png"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: hovered ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      />
      {/* Hover state */}
      <img
        src="/assets/images/LOGO-loading.png"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />
      {/* Overlay texture — always on top */}
      <img
        src="/assets/images/LOGO-overlay.png"
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          mixBlendMode: 'overlay',
          opacity: hovered ? 0.8 : 0.3,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
