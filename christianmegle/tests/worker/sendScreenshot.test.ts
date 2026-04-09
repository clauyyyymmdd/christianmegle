import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockEnv } from './setup';
import { sendScreenshotEmail } from '../../worker/features/email/sendScreenshot';

// Smallest valid base64 we can use as a stand-in JPEG payload.
// The handler only checks the character set + length; it doesn't
// decode or actually look at image bytes.
const TINY_B64 = 'SGVsbG8='; // "Hello" — 8 chars, well under the 500KB cap
const TINY_DATAURL = `data:image/jpeg;base64,${TINY_B64}`;

function makeRequest(body: unknown, ip: string) {
  return new Request('http://localhost/api/session-snapshot/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': ip,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

/**
 * The handler calls `sendEmail`, which only hits the network if
 * RESEND_API_KEY is set. We leave it unset so the real side effect
 * is a console.log in dev mode and the handler's success path runs.
 */
function makeEnv() {
  return createMockEnv({ RESEND_API_KEY: '' } as any);
}

/**
 * In-memory rate limit buckets persist across tests because the module
 * is imported once. Give each test a unique IP so they don't cross
 * the 3/hour per-IP cap, and unique emails so they don't cross the
 * 1/hour per-destination cooldown.
 */
let counter = 0;
function uniqueIp() {
  counter++;
  return `10.10.${Math.floor(counter / 256)}.${counter % 256}`;
}
function uniqueEmail() {
  counter++;
  return `user${counter}@example.com`;
}

beforeEach(() => {
  // Suppress the dev-mode [Email] console spam from sendEmail()
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sendScreenshotEmail — validation', () => {
  it('rejects invalid JSON with 400', async () => {
    const res = await sendScreenshotEmail(
      makeRequest('not-json', uniqueIp()),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Invalid JSON body.');
  });

  it('rejects missing email with 400', async () => {
    const res = await sendScreenshotEmail(
      makeRequest({ imageBase64: TINY_B64 }, uniqueIp()),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('A valid email address is required.');
  });

  it('rejects malformed email with 400', async () => {
    const res = await sendScreenshotEmail(
      makeRequest({ email: 'not-an-email', imageBase64: TINY_B64 }, uniqueIp()),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('A valid email address is required.');
  });

  it('rejects missing image payload with 400', async () => {
    const res = await sendScreenshotEmail(
      makeRequest({ email: uniqueEmail() }, uniqueIp()),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Screenshot payload is required.');
  });

  it('rejects oversized payload with 413', async () => {
    // 500KB + 1 char base64 string
    const huge = 'A'.repeat(500 * 1024 + 1);
    const res = await sendScreenshotEmail(
      makeRequest({ email: uniqueEmail(), imageBase64: huge }, uniqueIp()),
      makeEnv(),
    );
    expect(res.status).toBe(413);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Screenshot payload is too large.');
  });

  it('rejects non-base64 characters with 400', async () => {
    const res = await sendScreenshotEmail(
      makeRequest(
        { email: uniqueEmail(), imageBase64: '!!!not base64!!!' },
        uniqueIp(),
      ),
      makeEnv(),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Screenshot payload is malformed.');
  });
});

describe('sendScreenshotEmail — happy path', () => {
  it('accepts a raw base64 payload', async () => {
    const res = await sendScreenshotEmail(
      makeRequest({ email: uniqueEmail(), imageBase64: TINY_B64 }, uniqueIp()),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it('strips a data:image/jpeg;base64, prefix from the payload', async () => {
    const res = await sendScreenshotEmail(
      makeRequest(
        { email: uniqueEmail(), imageBase64: TINY_DATAURL },
        uniqueIp(),
      ),
      makeEnv(),
    );
    expect(res.status).toBe(200);
  });
});

describe('sendScreenshotEmail — per-IP rate limit (3/hour)', () => {
  it('allows 3 sends from a single IP then blocks the 4th', async () => {
    const ip = uniqueIp();
    const env = makeEnv();

    // Use DIFFERENT destination addresses each time so the destination
    // cooldown can't be what rejects us — this test is strictly about
    // the per-IP bucket.
    for (let i = 0; i < 3; i++) {
      const res = await sendScreenshotEmail(
        makeRequest(
          { email: uniqueEmail(), imageBase64: TINY_B64 },
          ip,
        ),
        env,
      );
      expect(res.status).toBe(200);
    }

    const blocked = await sendScreenshotEmail(
      makeRequest(
        { email: uniqueEmail(), imageBase64: TINY_B64 },
        ip,
      ),
      env,
    );
    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as { error: string };
    expect(body.error).toBe('Too many screenshot email requests. Try again later.');
  });

  it('keeps separate buckets for separate IPs', async () => {
    const emailA = uniqueEmail();
    const emailB = uniqueEmail();
    const env = makeEnv();

    // Burn one send from IP #1 to email A
    const first = await sendScreenshotEmail(
      makeRequest({ email: emailA, imageBase64: TINY_B64 }, uniqueIp()),
      env,
    );
    expect(first.status).toBe(200);

    // Different IP, different email — should succeed cleanly
    const second = await sendScreenshotEmail(
      makeRequest({ email: emailB, imageBase64: TINY_B64 }, uniqueIp()),
      env,
    );
    expect(second.status).toBe(200);
  });
});

describe('sendScreenshotEmail — per-destination cooldown (1/hour)', () => {
  it('blocks a second send to the same email within the window', async () => {
    const email = uniqueEmail();
    const env = makeEnv();

    const first = await sendScreenshotEmail(
      makeRequest({ email, imageBase64: TINY_B64 }, uniqueIp()),
      env,
    );
    expect(first.status).toBe(200);

    // Fresh IP so we can't be tripping the per-IP bucket
    const second = await sendScreenshotEmail(
      makeRequest({ email, imageBase64: TINY_B64 }, uniqueIp()),
      env,
    );
    expect(second.status).toBe(429);
    const body = (await second.json()) as { error: string };
    expect(body.error).toBe(
      'Screenshots were recently sent to this email address. Try again later.',
    );
  });

  it('normalizes email casing and whitespace so the cooldown cannot be bypassed', async () => {
    const base = uniqueEmail(); // e.g. user123@example.com
    const env = makeEnv();

    // First send with the canonical lowercase form
    const first = await sendScreenshotEmail(
      makeRequest({ email: base, imageBase64: TINY_B64 }, uniqueIp()),
      env,
    );
    expect(first.status).toBe(200);

    // Retry with mixed case and padding whitespace — should still be
    // blocked because the handler normalizes via trim + toLowerCase
    // before keying the destination bucket.
    const noisy = `  ${base.toUpperCase()}  `;
    const second = await sendScreenshotEmail(
      makeRequest({ email: noisy, imageBase64: TINY_B64 }, uniqueIp()),
      env,
    );
    expect(second.status).toBe(429);
    const body = (await second.json()) as { error: string };
    expect(body.error).toBe(
      'Screenshots were recently sent to this email address. Try again later.',
    );
  });

  it('IP rate limit is checked before body parsing (rejects before destination key is touched)', async () => {
    // Exhaust an IP with 3 valid sends to 3 different emails...
    const ip = uniqueIp();
    const env = makeEnv();
    const emails: string[] = [];
    for (let i = 0; i < 3; i++) {
      const email = uniqueEmail();
      emails.push(email);
      const ok = await sendScreenshotEmail(
        makeRequest({ email, imageBase64: TINY_B64 }, ip),
        env,
      );
      expect(ok.status).toBe(200);
    }

    // ...then send a 4th from the same IP to a brand-new email. If
    // the per-IP check ran AFTER the destination check, this would
    // burn the new email's cooldown slot. It should instead reject
    // with the IP-limit error, leaving the new email's bucket clean.
    const freshEmail = uniqueEmail();
    const blocked = await sendScreenshotEmail(
      makeRequest({ email: freshEmail, imageBase64: TINY_B64 }, ip),
      env,
    );
    expect(blocked.status).toBe(429);
    const body = (await blocked.json()) as { error: string };
    expect(body.error).toBe('Too many screenshot email requests. Try again later.');

    // Prove the destination cooldown for `freshEmail` is untouched:
    // a different IP sending to it should succeed.
    const fromElsewhere = await sendScreenshotEmail(
      makeRequest({ email: freshEmail, imageBase64: TINY_B64 }, uniqueIp()),
      env,
    );
    expect(fromElsewhere.status).toBe(200);
  });
});
