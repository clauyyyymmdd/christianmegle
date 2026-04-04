import type { Env } from '../../lib/types';
import { json } from '../../lib/types';

export async function getIceConfig(_request: Request, env: Env): Promise<Response> {
  // Keep the fallback STUNs
  const fallback = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // If Cloudflare TURN is not configured yet, return fallback only
  if (!env.CF_TURN_KEY_ID || !env.CF_TURN_KEY_SECRET) {
    return json(fallback);
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
    const text = await resp.text();
    console.error('Cloudflare TURN credential generation failed:', text);
    return json(fallback, { status: 200 });
  }

  const data = await resp.json() as { iceServers?: RTCIceServer[] };

  return json({
    iceServers: data.iceServers ?? fallback.iceServers,
  });
}
