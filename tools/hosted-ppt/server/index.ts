import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import type { Env } from './lib/types.js';
import { errorHandler } from './middleware/error.js';
import auth from './routes/auth.js';
import presentations from './routes/presentations.js';
import links from './routes/links.js';
import events from './routes/events.js';
import analytics from './routes/analytics.js';
import leads from './routes/leads.js';
import agent from './routes/agent.js';
import notifications from './routes/notifications.js';

const app = new Hono<Env>();

const allowedOrigin = process.env.PUBLIC_BASE_URL || '*';

app.use(
  '*',
  cors({
    origin: allowedOrigin === '*' ? '*' : (origin) => origin || allowedOrigin,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Access-Token'],
    credentials: true,
  })
);

app.use('*', logger());

app.get('/api/health', (c) => {
  return c.json({ data: { status: 'ok', time: new Date().toISOString() } });
});

app.route('/api/auth', auth);
app.route('/api/presentations', presentations);
app.route('/api/links', links);
app.route('/api/events', events);
app.route('/api/analytics', analytics);
app.route('/api/leads', leads);
app.route('/api/agent', agent);
app.route('/api/notifications', notifications);

app.notFound((c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
});

app.onError((err, c) => errorHandler(err, c));

const port = Number(process.env.PORT) || 3001;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`[server] hosted-ppt API listening on http://localhost:${info.port}`);
  }
);

export default app;
