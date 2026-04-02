import type { Env } from '../../lib/types';
import { json } from '../../lib/types';

export async function getLeaderboard(_request: Request, env: Env): Promise<Response> {
  const results = await env.DB.prepare(`
    SELECT p.display_name, COUNT(s.id) as pardons
    FROM priests p
    LEFT JOIN sessions s ON s.priest_id = p.id AND s.ended_at IS NOT NULL
    WHERE p.status = 'approved'
    GROUP BY p.id
    HAVING pardons > 0
    ORDER BY pardons DESC
    LIMIT 50
  `).all();

  return json(results.results);
}
