import { Request, Response, NextFunction } from 'express';
import { adminClient } from '../lib/supabase-admin.js';
import { createClient, User, SupabaseClient } from '@supabase/supabase-js';

// Extend Express Request with user context
declare global {
  namespace Express {
    interface Request {
      user?: User & { role?: string };
      /** Authenticated Supabase client for this request's user */
      supabaseClient?: SupabaseClient<any, 'public', any>;
    }
  }
}

/**
 * JWT verification middleware.
 * Extracts Bearer token from Authorization header and verifies with Supabase.
 * Attaches `req.user` (verified user info) and `req.supabaseClient` on success.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await adminClient.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Create an authenticated client for user-level operations
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const supabaseUrl = process.env.SUPABASE_URL!;
    const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch user's role from profiles
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    req.user = { ...user, role: profile?.role || 'student' };
    req.supabaseClient = authedClient;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware that requires the user to have admin role.
 * Must be used after `requireAuth`.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
