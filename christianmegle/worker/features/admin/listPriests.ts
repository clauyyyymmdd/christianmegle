import type { Env } from '../../lib/types';
import { json } from '../../lib/types';

export async function listPriests(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${env.ADMIN_SECRET}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'pending';

  const priests = await env.DB.prepare(
    'SELECT * FROM priests WHERE status = ? ORDER BY created_at DESC'
  )
    .bind(status)
    .all();

  return json(priests.results);
}
