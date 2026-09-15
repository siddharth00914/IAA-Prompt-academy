import { serve } from '@hono/node-server';
import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { auth } from './auth.ts';
import { db } from './db.ts';
import { progressRoutes } from './progress-routes.ts';

const app = new Hono();

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

app.route('/api/progress', progressRoutes);

app.get('/api/health', async (c) => {
  await db.execute(sql`SELECT 1`);
  return c.json({ status: 'ok', database: 'connected' });
});

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
