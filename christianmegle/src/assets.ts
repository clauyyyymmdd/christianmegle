/**
 * Single source of truth for branding assets.
 *
 * Change a logo file? Update the path here. Every component that
 * displays branding pulls from this registry — no hardcoded
 * /assets/images/* paths anywhere else in the source.
 *
 * The favicon is wired separately in index.html and must stay in
 * sync with `appMark` below.
 */

export const brand = {
  /** Wordmark — used on the landing page */
  wordmark: '/assets/images/wordmark.png',

  /** Cross logo layers — used by CrossLogo component */
  cross: {
    base: '/assets/images/LOGO.png',
    hover: '/assets/images/LOGO-loading.png',
    overlay: '/assets/images/LOGO-overlay.png',
  },

  /** App mark — favicon, share thumbnails, app icon. Must match index.html <link rel="icon"> */
  appMark: '/assets/images/LOGO.png',
} as const;

// Re-export the emblem component so all branding flows through one module.
// Consumers: `import { brand, CrossLogo } from '../assets'`
export { default as CrossLogo } from './components/CrossLogo';
