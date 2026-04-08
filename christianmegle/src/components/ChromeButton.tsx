import type { ReactNode, CSSProperties } from 'react';

interface ChromeButtonProps {
  onClick?: () => void;
  children?: ReactNode;
  style?: CSSProperties;
  ariaLabel?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

/**
 * Chrome button — uses button-default.png as the resting frame and
 * a 12-frame sprite sheet (button-hover-sprite.png) animated through
 * once on hover via background-position + steps(12).
 *
 * The sprite is preloaded by index.html so the first hover never flickers.
 */
export default function ChromeButton({
  onClick,
  children,
  style,
  ariaLabel,
  type = 'button',
  disabled,
}: ChromeButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className="chrome-button"
      style={style}
    >
      <span className="chrome-button__label">{children}</span>
    </button>
  );
}
