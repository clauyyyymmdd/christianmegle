export interface Env {
  SIGNALING: DurableObjectNamespace;
  MATCHMAKER: DurableObjectNamespace;
  DB: D1Database;
  ADMIN_SECRET: string;
  CF_TURN_KEY_ID?: string;
  CF_TURN_KEY_SECRET?: string;
  NOTIFICATION_EMAIL: string;
  RESEND_API_KEY?: string;
  ALLOWED_ORIGIN?: string;
}

export function corsHeaders(request?: Request, env?: Env): Record<string, string> {
  const origin = request?.headers.get('Origin') || '*';
  const allowed = env?.ALLOWED_ORIGIN || '*';
  return {
    'Access-Control-Allow-Origin': allowed === '*' ? origin : allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

export function json(data: unknown, init?: { status?: number }, request?: Request, env?: Env): Response {
  return Response.json(data, { status: init?.status, headers: corsHeaders(request, env) });
}
