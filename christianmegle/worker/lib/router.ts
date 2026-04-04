import type { Env } from './types';
import { corsHeaders } from './types';

type Handler = (
  request: Request,
  env: Env,
  params: Record<string, string>
) => Promise<Response> | Response;

interface Route {
  method: string;
  pattern: URLPattern;
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  get(path: string, handler: Handler) {
    this.add('GET', path, handler);
  }

  post(path: string, handler: Handler) {
    this.add('POST', path, handler);
  }

  all(path: string, handler: Handler) {
    this.add('*', path, handler);
  }

  private add(method: string, path: string, handler: Handler) {
    this.routes.push({
      method,
      pattern: new URLPattern({ pathname: path }),
      handler,
    });
  }

  async handle(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);

    for (const route of this.routes) {
      if (route.method !== '*' && route.method !== request.method) continue;
      const match = route.pattern.exec(url);
      if (match) {
        const params = match.pathname.groups as Record<string, string>;
        return route.handler(request, env, params);
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders(request, env) });
  }
}
