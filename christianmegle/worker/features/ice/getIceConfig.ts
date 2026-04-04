import type { Env } from '../../lib/types';
import { json } from '../../lib/types';
import { rateLimit, clientIp } from '../../lib/rateLimit';

const FALLBACK = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export async function getIceConfig(request: Request, env: Env): Promise<Response> {
  // Rate limit: 10 per IP per 5 minutes
  const rl = rateLimit(`ice:${clientIp(request)}`, 10, 5 * 60 * 1000);
  if (!rl.allowed) {
    return json(FALLBACK);
  }

  if (!env.CF_TURN_KEY_ID || !env.CF_TURN_KEY_SECRET) {
    return json(FALLBACK);
  }

  const resp = await fetch(
    `https://rtc.live.cloudflare.com/v1/turn/keys/${env.CF_TURN_KEY_ID}/credentials/generate-ice-servers`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CF_TURN_KEY_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ttl: 86400 }),
    }
  );

  if (!resp.ok) {
    console.error('Cloudflare TURN failed:', resp.status);
    return json(FALLBACK);
  }

  const data = await resp.json() as { iceServers?: RTCIceServer[] };

  return json({
    iceServers: data.iceServers ?? FALLBACK.iceServers,
  });
}
