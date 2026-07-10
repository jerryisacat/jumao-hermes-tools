import type { Context } from 'hono';

export interface Env {
  Variables: {
    agentId?: string;
    authMethod?: 'agent' | 'admin' | 'reader';
    adminUser?: { id: string; email: string };
    reader?: { email: string; accessLinkId: string | null };
  };
  Bindings: Record<string, unknown>;
}

export type AppContext = Context<Env>;

export const JsonError = (code: string, message: string, status: number): Response =>
  new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
