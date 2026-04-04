export interface Env {
  SIGNALING: DurableObjectNamespace;
  MATCHMAKER: DurableObjectNamespace;
  DB: D1Database;
  ADMIN_SECRET: string;
  CF_TURN_KEY_ID?: string;
  CF_TURN_KEY_SECRET?: string;
  NOTIFICATION_EMAIL: string;
  RESEND_API_KEY?: string;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function json(data: unknown, init?: { status?: number }): Response {
  return Response.json(data, { status: init?.status, headers: corsHeaders });
}
