import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
}

export class HttpError extends Error implements AppError {
  code: string;
  statusCode: number;
  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: Error, c: Context): Response {
  const isProd = process.env.NODE_ENV === 'production';

  if (err instanceof ZodError) {
    const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return c.json({ error: { code: 'VALIDATION_ERROR', message } }, 400 as ContentfulStatusCode);
  }

  if (err instanceof HttpError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.statusCode as ContentfulStatusCode);
  }

  console.error('[error] Unhandled:', err);
  const message = isProd ? 'Internal server error' : err.message;
  return c.json({ error: { code: 'INTERNAL_ERROR', message } }, 500 as ContentfulStatusCode);
}
