import type { Env } from '../../lib/types';
import { json } from '../../lib/types';

export async function updatePriestStatus(
  request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${env.ADMIN_SECRET}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: priestId, action } = params;
  const body: { notes?: string } = await request.json().catch(() => ({}));

  await env.DB.prepare(
    `UPDATE priests SET status = ?, approved_at = datetime('now'), notes = ? WHERE id = ?`
  )
    .bind(action === 'approve' ? 'approved' : 'rejected', body.notes || null, priestId)
    .run();

  return json({ success: true, action });
}
