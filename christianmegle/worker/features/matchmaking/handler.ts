import type { Env } from '../../lib/types';

export function handleWebSocket(request: Request, env: Env): Response {
  const matchmakerId = env.MATCHMAKER.idFromName('global');
  const matchmaker = env.MATCHMAKER.get(matchmakerId);
  return matchmaker.fetch(request) as unknown as Response;
}
