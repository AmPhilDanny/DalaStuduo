import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import { errorHandler } from './middleware/error.js';
import { requireAuth } from './middleware/auth.js';
import { adminClient } from './lib/supabase-admin.js';
import { createClient } from '@supabase/supabase-js';
import { adminRouter } from './routes/admin/index.js';
import { marketplaceRouter } from './routes/marketplace/index.js';
import { paymentsRouter } from './routes/payments/index.js';
import { walletRouter } from './routes/wallet/index.js';
import { messagingRouter } from './routes/messaging/index.js';
import { aiRouter } from './routes/ai/index.js';
import { b2bRouter } from './routes/b2b/index.js';
import { notificationsRouter } from './routes/notifications/index.js';
import { webhooksRouter } from './routes/webhooks/index.js';
import { emailRouter } from './routes/email/index.js';
import { githubRouter } from './routes/github/index.js';

// Middleware to set up supabase client for all requests (authenticated or not)
function setupSupabaseClient(req: any, res: any, next: any) {
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
  const supabaseUrl = process.env.SUPABASE_URL!;
  
  // If we already have a supabaseClient (from requireAuth), use it
  if (!req.supabaseClient) {
    // Create an anonymous client
    req.supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  
  next();
}

const logger = pino({ name: 'skillbridge-server' });
const app: Express = express();
const PORT = parseInt(process.env.PORT || '4001', 10);

// ── Global Middleware ──
app.use(helmet());
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:4000', 'https://*.onrender.com'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, path: req.path }, 'request');
  next();
});

// Setup Supabase client for all requests
app.use(setupSupabaseClient);

// ── Health Check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Public: site config (cached for public consumption, bypasses RLS) ──
app.get('/api/site-config', async (_req, res) => {
  const { data, error } = await adminClient
    .from('site_settings')
    .select('value')
    .eq('key', 'site_config')
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ data: data?.value || null });
});

// ── Public Routes (no auth required) ──
app.use('/api/webhooks', webhooksRouter);
// Public marketplace routes (no auth)
app.use('/api/marketplace', marketplaceRouter);

// ── Authenticated Routes (these use requireAuth, which will overwrite req.supabaseClient and set req.user) ──
app.use('/api/payments', requireAuth, paymentsRouter);
app.use('/api/wallet', requireAuth, walletRouter);
app.use('/api/messaging', requireAuth, messagingRouter);
app.use('/api/ai', requireAuth, aiRouter);
app.use('/api/b2b', requireAuth, b2bRouter);
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api/email', requireAuth, emailRouter);
app.use('/api/github', requireAuth, githubRouter);

// ── Admin Routes (auth + admin role) ──
app.use('/api/admin', requireAuth, adminRouter);

// ── Error Handler ──
app.use(errorHandler);

// ── Start Server ──
app.listen(PORT, () => {
  logger.info(`SkillBridge API server running on port ${PORT}`);
});

export default app;
