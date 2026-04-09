import type { Env } from '../../lib/types';
import { json } from '../../lib/types';
import { rateLimit, clientIp } from '../../lib/rateLimit';
import { sendEmail } from './send';

/**
 * POST /api/session-snapshot/email
 *
 * Accepts a JPEG data URL captured during a confession session plus
 * a destination email address, and ships it as an attachment via the
 * existing email sender. No persistence — the image is forwarded and
 * dropped.
 *
 * Abuse protection (server-side only, no Turnstile / CAPTCHA / honeypot):
 *   - Per-IP rate limit: 3 sends per hour, keyed
 *       share-screenshots:ip:${ip}
 *   - Per-destination cooldown: 1 send per hour per normalized email,
 *     keyed
 *       share-screenshots:dest:${trim().toLowerCase()}
 */

const MAX_IMAGE_BYTES = 500 * 1024; // 500 KB hard ceiling on the base64 payload
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Body {
  email?: unknown;
  imageBase64?: unknown;
}

export async function sendScreenshotEmail(request: Request, env: Env): Promise<Response> {
  // ── Per-IP rate limit ─────────────────────────────────────────
  const ip = clientIp(request);
  const ipLimit = rateLimit(`share-screenshots:ip:${ip}`, 3, 60 * 60 * 1000);
  if (!ipLimit.allowed) {
    return json(
      { error: 'Too many screenshot email requests. Try again later.' },
      { status: 429 },
    );
  }

  // ── Parse + validate body ─────────────────────────────────────
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const rawEmail = typeof body.email === 'string' ? body.email : '';
  const normalizedEmail = rawEmail.trim().toLowerCase();
  if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
    return json({ error: 'A valid email address is required.' }, { status: 400 });
  }

  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
  if (!imageBase64) {
    return json({ error: 'Screenshot payload is required.' }, { status: 400 });
  }
  if (imageBase64.length > MAX_IMAGE_BYTES) {
    return json({ error: 'Screenshot payload is too large.' }, { status: 413 });
  }

  // Accept either a raw base64 string or a full data URL. We only want
  // the base64 body for the attachment.
  const base64 = imageBase64.startsWith('data:')
    ? imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '')
    : imageBase64;
  if (!base64 || !/^[A-Za-z0-9+/=]+$/.test(base64)) {
    return json({ error: 'Screenshot payload is malformed.' }, { status: 400 });
  }

  // ── Per-destination cooldown ──────────────────────────────────
  // Keyed on the normalized email so casing/whitespace shenanigans
  // (alice@X.com vs ALICE@x.COM) can't bypass the limit.
  const destLimit = rateLimit(
    `share-screenshots:dest:${normalizedEmail}`,
    1,
    60 * 60 * 1000,
  );
  if (!destLimit.allowed) {
    return json(
      { error: 'Screenshots were recently sent to this email address. Try again later.' },
      { status: 429 },
    );
  }

  // ── Send ──────────────────────────────────────────────────────
  try {
    await sendEmail(env, {
      to: normalizedEmail,
      subject: 'A moment from your confession',
      body:
        'Attached is a moment captured during your session on christianmegle.\n\n' +
        'Go in peace.',
      attachments: [
        {
          filename: 'confession.jpg',
          content: base64,
          contentType: 'image/jpeg',
        },
      ],
    });
  } catch (err) {
    console.error('[sendScreenshotEmail] send failed', err);
    return json({ error: 'Failed to send email.' }, { status: 500 });
  }

  return json({ success: true });
}
