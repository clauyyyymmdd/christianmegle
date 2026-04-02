import type { Env } from '../../lib/types';
import { json } from '../../lib/types';

export async function getPriestStatus(
  _request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> {
  const priestId = params.id;
  const priest = await env.DB.prepare('SELECT * FROM priests WHERE id = ?')
    .bind(priestId)
    .first() as any;

  if (!priest) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  // Auto-approve priests who passed the quiz after 30 seconds
  if (priest.status === 'pending') {
    const createdAt = new Date(priest.created_at).getTime();
    const thirtySeconds = 30 * 1000;
    const passed = priest.quiz_score >= Math.ceil(priest.quiz_total * 0.6);

    if (passed && (Date.now() - createdAt) >= thirtySeconds) {
      await env.DB.prepare(
        `UPDATE priests SET status = 'approved', approved_at = datetime('now'), notes = 'Auto-approved after 30 seconds' WHERE id = ?`
      ).bind(priestId).run();

      return json({ id: priest.id, displayName: priest.display_name, status: 'approved' });
    }
  }

  return json({ id: priest.id, displayName: priest.display_name, status: priest.status });
}
