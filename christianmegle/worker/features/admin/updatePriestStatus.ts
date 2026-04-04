import type { Env } from '../../lib/types';
import { json } from '../../lib/types';
import { isValidPriestId, sanitizeString } from '../../lib/validate';

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

  if (!isValidPriestId(priestId)) {
    return json({ error: 'Invalid priest ID' }, { status: 400 });
  }
  if (action !== 'approve' && action !== 'reject') {
    return json({ error: 'Invalid action' }, { status: 400 });
  }

  const body: { notes?: string } = await request.json().catch(() => ({}));
  const notes = body.notes ? sanitizeString(body.notes, 1000) : null;

  await env.DB.prepare(
    `UPDATE priests SET status = ?, approved_at = datetime('now'), notes = ? WHERE id = ?`
  )
    .bind(action === 'approve' ? 'approved' : 'rejected', notes, priestId)
    .run();

  return json({ success: true, action });
}
