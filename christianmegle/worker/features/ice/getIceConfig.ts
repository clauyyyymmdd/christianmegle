import type { Env } from '../../lib/types';
import { json } from '../../lib/types';

export function getIceConfig(_request: Request, env: Env): Response {
  const config = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ] as any[],
  };

  if (env.TURN_SERVER_URL) {
    config.iceServers.push({
      urls: env.TURN_SERVER_URL,
      username: env.TURN_USERNAME,
      credential: env.TURN_CREDENTIAL,
    });
  }

  return json(config);
}
