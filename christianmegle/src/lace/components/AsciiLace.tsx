import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { loadLaceProfile } from '../profileLoader';

/**
 * Profile-driven ASCII lace renderer. Fetches `/lace/<profile>.json`,
 * pulls the `ascii` field out (or falls back to runtime generation for
 * legacy sacred-lace-border-v1 files), and renders it in a <pre> with
 * the exact typography spec from christianmegle-lace-studio.html:
 *
 *   font-family: 'JetBrains Mono', monospace
 *   font-size:   9px
 *   line-height: 9px
 *   color:       var(--lace, #d8d0c4)
 *   white-space: pre
 *
 * The `target` prop maps to the four wrapper behaviors described by
 * the studio's React export: LaceFrame (fullscreen fixed overlay),
 * LaceBorder (inline), LaceDivider (vertical-lr writing mode), and
 * LaceLoading (opacity fade-in). `raw` is the bare <pre>.
 *
 * Children, when provided, are rendered on top of the lace inside the
 * same wrapper — used by the loading screen to overlay a Bible verse
 * on the loading.json frame without a second JSON profile.
 */

type LaceTarget = 'LaceFrame' | 'LaceBorder' | 'LaceDivider' | 'LaceLoading' | 'raw';

interface AsciiLaceProps {
  profile: string;
  target?: LaceTarget;
  style?: CSSProperties;
  /** Content rendered on top of the lace inside the same wrapper. */
  children?: ReactNode;
}

const preStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '9px',
  lineHeight: '9px',
  letterSpacing: 0,
  color: 'var(--lace, #d8d0c4)',
  whiteSpace: 'pre',
  pointerEvents: 'none',
  margin: 0,
  padding: 0,
};

const frameWrapStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingLeft: '2in',
  overflow: 'hidden',
  animation: 'lacePulse 8s ease-in-out infinite',
};

const dividerWrapStyle: CSSProperties = {
  writingMode: 'vertical-lr',
  display: 'inline-block',
  animation: 'lacePulse 8s ease-in-out infinite',
};

const loadingWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'laceFadeIn 1.2s ease-out forwards',
};

export function AsciiLace({ profile, target = 'LaceBorder', style, children }: AsciiLaceProps) {
  const [ascii, setAscii] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLaceProfile(profile).then((value) => {
      if (!cancelled) setAscii(value);
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Render nothing until the first fetch resolves, to avoid a layout
  // jolt. An empty string (profile missing or unparseable) also renders
  // nothing — the lace is decorative and should never block content.
  if (ascii == null || ascii.length === 0) {
    return children ? <>{children}</> : null;
  }

  const pre = (
    <pre style={{ ...preStyle, ...(target === 'raw' ? style : undefined) }}>
      {ascii}
    </pre>
  );

  switch (target) {
    case 'LaceFrame':
      return (
        <div style={{ ...frameWrapStyle, ...style }}>
          {pre}
          {children}
        </div>
      );
    case 'LaceDivider':
      return (
        <div style={{ ...dividerWrapStyle, ...style }}>
          {pre}
          {children}
        </div>
      );
    case 'LaceLoading':
      return (
        <div style={{ ...loadingWrapStyle, ...style }}>
          {pre}
          {children}
        </div>
      );
    case 'LaceBorder':
    case 'raw':
    default:
      return children ? (
        <>
          {pre}
          {children}
        </>
      ) : (
        pre
      );
  }
}
