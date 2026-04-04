import type { Env } from '../../lib/types';
import { json } from '../../lib/types';
import { sendNotification } from './send';

export async function reportBug(request: Request, env: Env): Promise<Response> {
  const body: { description: string; url?: string } = await request.json();

  if (!body.description?.trim()) {
    return json({ error: 'Description is required' }, { status: 400 });
  }

  try {
    await sendNotification(env, {
      type: 'bug-report',
      description: body.description.trim(),
      userAgent: request.headers.get('User-Agent') || undefined,
      url: body.url,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Failed to send bug report email:', e);
    return json({ error: 'Failed to send report' }, { status: 500 });
  }

  return json({ success: true });
}
