import type { Env } from '../../lib/types';
import { json } from '../../lib/types';
import { sendNotification } from './send';
import { rateLimit, clientIp } from '../../lib/rateLimit';
import { sanitizeString } from '../../lib/validate';

export async function reportBug(request: Request, env: Env): Promise<Response> {
  // Rate limit: 5 reports per IP per hour
  const ip = clientIp(request);
  const rl = rateLimit(`bug:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return json({ error: 'Too many reports. Try again later.' }, { status: 429 });
  }

  const body: { description: string; url?: string } = await request.json();

  const description = sanitizeString(body.description, 5000);
  if (!description) {
    return json({ error: 'Description is required (max 5000 chars)' }, { status: 400 });
  }

  // Validate URL if provided
  let url: string | undefined;
  if (body.url) {
    try {
      const parsed = new URL(body.url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        url = parsed.href;
      }
    } catch {
      // ignore invalid URLs
    }
  }

  try {
    await sendNotification(env, {
      type: 'bug-report',
      description,
      userAgent: request.headers.get('User-Agent') || undefined,
      url,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Failed to send bug report email');
    return json({ error: 'Failed to send report' }, { status: 500 });
  }

  return json({ success: true });
}
