import type { Env } from '../../lib/types';

export async function handleWebSocket(request: Request, env: Env): Promise<Response> {
  const matchmakerId = env.MATCHMAKER.idFromName('global');
  const matchmaker = env.MATCHMAKER.get(matchmakerId);
  return matchmaker.fetch(request);
}
