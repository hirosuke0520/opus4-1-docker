import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { PrismaClient } from '@prisma/client';
import { createAuthRoutes } from './routes/auth';
import { createCompanyRoutes } from './routes/companies';
import { createLeadRoutes } from './routes/leads';
import { createDealRoutes } from './routes/deals';
import { createActivityRoutes } from './routes/activities';

const app = new Hono();
const prisma = new PrismaClient();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://web:3000'],
    credentials: true,
  })
);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.route('/auth', createAuthRoutes(prisma));
app.route('/companies', createCompanyRoutes(prisma));
app.route('/leads', createLeadRoutes(prisma));
app.route('/deals', createDealRoutes(prisma));
app.route('/activities', createActivityRoutes(prisma));

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    500
  );
});

const port = parseInt(process.env.API_PORT || '8787');

serve({
  fetch: app.fetch,
  port,
});

console.log(`API server running on http://localhost:${port}`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});