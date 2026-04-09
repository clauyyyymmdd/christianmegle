import { useEffect, useRef, useCallback, type RefObject } from 'react';

/**
 * Fires timed screenshots of the current WebRTC session into a single
 * shared slot owned by the confessional flow.
 *
 * Capture rules (per SessionShell mount — each new match resets):
 *   - 1:11        (71 s)   → snap
 *   - 33:33       (2013 s) → snap
 *   - 1:11:11     (4271 s) → snap
 *   - Session ends before 1:11 → snap on the way out (via captureNow)
 *   - Session ends ≥ 1:11      → do nothing; the most recent timed snap
 *                                 is what the ended screen shows.
 *
 * Each snap composites remote (full cover-crop) + local PIP (240×135 in
 * the bottom-right) into a deterministic 960×540 JPEG, with a timestamp
 * chip top-left and a "✝ christianmegle" watermark top-right. Missing
 * video tracks render as a black panel with "NO SIGNAL".
 */

const OUT_W = 960;
const OUT_H = 540;
const PIP_W = 240;
const PIP_H = 135;
const PIP_MARGIN = 16;
const JPEG_QUALITY = 0.82;

/** Trigger marks in whole seconds of session-elapsed time. */
const TRIGGERS = [
  { at: 71, label: '01:11' },
  { at: 2013, label: '33:33' },
  { at: 4271, label: '1:11:11' },
] as const;

interface UseSessionScreenshotArgs {
  localVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
  /** True once the WebRTC session is live (remote stream attached). */
  sessionActive: boolean;
  /** Called with a JPEG data URL every time a snap fires. */
  onCapture: (dataUrl: string) => void;
}

interface UseSessionScreenshotReturn {
  /**
   * Force a capture now using the "session ended early" label. Used by
   * SessionShell when the user switches or ends before the first timed
   * trigger would have fired.
   */
  captureNow: () => void;
  /** True once any trigger has fired during this SessionShell mount. */
  hasCapturedRef: RefObject<boolean>;
}

export function useSessionScreenshot({
  localVideoRef,
  remoteVideoRef,
  sessionActive,
  onCapture,
}: UseSessionScreenshotArgs): UseSessionScreenshotReturn {
  const hasCapturedRef = useRef(false);
  // Off-screen canvas reused across snaps — cheaper than re-allocating.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const getCanvas = useCallback((): HTMLCanvasElement => {
    if (!canvasRef.current) {
      const c = document.createElement('canvas');
      c.width = OUT_W;
      c.height = OUT_H;
      canvasRef.current = c;
    }
    return canvasRef.current;
  }, []);

  const capture = useCallback(
    (label: string) => {
      const canvas = getCanvas();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Black letterbox background under everything.
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, OUT_W, OUT_H);

      // --- Remote video: full-frame cover crop ---
      drawCover(ctx, remoteVideoRef.current, 0, 0, OUT_W, OUT_H);

      // --- Local PIP: bottom-right, 1px ivory border ---
      const pipX = OUT_W - PIP_W - PIP_MARGIN;
      const pipY = OUT_H - PIP_H - PIP_MARGIN;
      ctx.fillStyle = '#000';
      ctx.fillRect(pipX - 1, pipY - 1, PIP_W + 2, PIP_H + 2);
      drawCover(ctx, localVideoRef.current, pipX, pipY, PIP_W, PIP_H);
      ctx.strokeStyle = 'rgba(245, 240, 230, 0.9)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pipX - 0.5, pipY - 0.5, PIP_W + 1, PIP_H + 1);

      // --- Timestamp chip, top-left ---
      ctx.font = "bold 22px 'IBM Plex Mono', monospace";
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const chipPadX = 14;
      const chipPadY = 8;
      const chipMetrics = ctx.measureText(label);
      const chipW = chipMetrics.width + chipPadX * 2;
      const chipH = 22 + chipPadY * 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(PIP_MARGIN, PIP_MARGIN, chipW, chipH);
      ctx.fillStyle = '#f5f0e6';
      ctx.fillText(label, PIP_MARGIN + chipPadX, PIP_MARGIN + chipH / 2);

      // --- Watermark, top-right ---
      ctx.font = "18px 'IBM Plex Mono', monospace";
      ctx.textAlign = 'right';
      const wm = '✝ christianmegle';
      const wmMetrics = ctx.measureText(wm);
      const wmW = wmMetrics.width + chipPadX * 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(OUT_W - PIP_MARGIN - wmW, PIP_MARGIN, wmW, chipH);
      ctx.fillStyle = '#f5f0e6';
      ctx.fillText(wm, OUT_W - PIP_MARGIN - chipPadX, PIP_MARGIN + chipH / 2);

      try {
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        hasCapturedRef.current = true;
        onCapture(dataUrl);
      } catch (err) {
        // toDataURL can throw SecurityError if the canvas is tainted
        // (remote stream with cross-origin constraints, etc.). Don't
        // crash the session — just skip this snap.
        console.warn('[screenshot] capture failed:', err);
      }
    },
    [getCanvas, localVideoRef, remoteVideoRef, onCapture],
  );

  const captureNow = useCallback(() => {
    // Used only when the session ends before the 1:11 mark. Label the
    // result with the wall-clock session length if we can grab it off
    // the remote video's currentTime; fall back to a generic tag.
    const v = remoteVideoRef.current;
    const secs =
      v && Number.isFinite(v.currentTime) ? Math.floor(v.currentTime) : 0;
    const label = secs > 0 ? formatElapsed(secs) : 'end';
    capture(label);
  }, [capture, remoteVideoRef]);

  // Schedule the three timed triggers once the session becomes active.
  // Each new SessionShell mount = each new match = fresh timers.
  useEffect(() => {
    if (!sessionActive) return;
    hasCapturedRef.current = false;

    const timeouts = TRIGGERS.map(({ at, label }) =>
      window.setTimeout(() => capture(label), at * 1000),
    );

    return () => {
      for (const t of timeouts) window.clearTimeout(t);
    };
  }, [sessionActive, capture]);

  return { captureNow, hasCapturedRef };
}

// ── helpers ──────────────────────────────────────────────────

/**
 * Draw a video element into a target rect using `object-fit: cover`
 * semantics — scale up to fill, crop overflow along the longer axis.
 * Missing / not-ready videos render as a black panel with "NO SIGNAL".
 */
function drawCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement | null,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const ready =
    video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;

  if (!ready) {
    ctx.fillStyle = '#0a0808';
    ctx.fillRect(dx, dy, dw, dh);
    ctx.save();
    ctx.fillStyle = '#3a3028';
    ctx.font = `${Math.max(10, Math.floor(dh / 9))}px 'IBM Plex Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NO SIGNAL', dx + dw / 2, dy + dh / 2);
    ctx.restore();
    return;
  }

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const targetRatio = dw / dh;
  const sourceRatio = vw / vh;

  let sx: number, sy: number, sw: number, sh: number;
  if (sourceRatio > targetRatio) {
    // Source is wider → crop sides
    sh = vh;
    sw = vh * targetRatio;
    sx = (vw - sw) / 2;
    sy = 0;
  } else {
    // Source is taller → crop top/bottom
    sw = vw;
    sh = vw / targetRatio;
    sx = 0;
    sy = (vh - sh) / 2;
  }

  ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
