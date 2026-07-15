import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adminClient } from '../../lib/supabase-admin.js';
import { requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { auditLog } from '../../middleware/audit.js';
import { AppError } from '../../middleware/error.js';

export const adminRouter: Router = Router();

// All admin routes require auth + admin role
adminRouter.use(requireAdmin);

// ── GET /admin/stats ──
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  const [profileCount, orderData, disputeData, payoutData, txData] = await Promise.all([
    adminClient.from('profiles').select('id', { count: 'exact', head: true }),
    adminClient.from('orders').select('status, amount'),
    adminClient.from('disputes').select('status'),
    adminClient.from('payouts').select('status, amount'),
    adminClient.from('wallet_transactions').select('type, amount'),
  ]);

  const totalUsers = profileCount?.count ?? 0;
  const totalOrders = orderData?.data?.length ?? 0;
  const completedOrders = (orderData?.data || []).filter((o: any) => o.status === 'completed').length;
  const totalRevenue = (txData?.data || [])
    .filter((tx: any) => tx.type === 'credit')
    .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
  const pendingPayouts = (payoutData?.data || [])
    .filter((p: any) => p.status === 'pending')
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const openDisputes = (disputeData?.data || []).filter((d: any) => d.status === 'open' || d.status === 'under_review').length;

  res.json({
    data: {
      total_users: totalUsers,
      total_orders: totalOrders,
      completed_orders: completedOrders,
      total_revenue: totalRevenue,
      pending_payouts: pendingPayouts,
      open_disputes: openDisputes,
    },
  });
});

// ── GET /admin/users ──
adminRouter.get('/users', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const roleFilter = req.query.role as string | undefined;
  const search = req.query.search as string | undefined;

  let countQuery = adminClient.from('profiles').select('id', { count: 'exact', head: true });
  if (roleFilter) countQuery = countQuery.eq('role', roleFilter);
  const { count } = await countQuery;

  let query = adminClient.from('profiles').select('*').order('created_at', { ascending: false });
  if (roleFilter) query = query.eq('role', roleFilter);
  if (search) query = query.ilike('full_name', `%${search}%`);

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) throw new AppError(500, error.message);

  res.json({ data, count, limit, offset });
});

// ── PATCH /admin/users/:id/role ──
adminRouter.patch('/users/:id/role',
  validate(z.object({ role: z.enum(['student', 'firm', 'admin']) })),
  async (req: Request, res: Response) => {
    const { role } = req.body;
    const { id } = req.params;

    const { data, error } = await adminClient
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new AppError(500, error.message);

    res.json({ data });
  }
);

// ── GET /admin/users/:id ──
adminRouter.get('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw new AppError(404, 'User not found');
  res.json({ data });
});

// ── PATCH /admin/users/:id/profile ──
adminRouter.patch('/users/:id/profile',
  validate(z.object({
    full_name: z.string().optional(),
    company_name: z.string().optional(),
    avatar_url: z.string().optional(),
    bio: z.string().optional(),
  })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const allowedFields = ['full_name', 'company_name', 'avatar_url', 'bio'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if ((req.body as any)[field] !== undefined) updates[field] = (req.body as any)[field];
    }
    if (Object.keys(updates).length === 0) {
      throw new AppError(400, 'No valid fields to update');
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await adminClient
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new AppError(500, error.message);
    res.json({ data });
  }
);

// ── GET /admin/services ──
adminRouter.get('/services', async (_req: Request, res: Response) => {
  const { data, error } = await adminClient.from('services').select('*').order('name');
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// ── POST /admin/services ──
adminRouter.post('/services',
  validate(z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    category: z.string().min(1),
    base_price: z.number().optional(),
    is_active: z.boolean().optional(),
  })),
  auditLog('create_service', 'services', (req) => null),
  async (req: Request, res: Response) => {
    const { name, slug, description, category, base_price, is_active } = req.body;
    const { data, error } = await adminClient
      .from('services')
      .insert({ name, slug, description: description || null, category, base_price: base_price ?? 0, is_active: is_active ?? true })
      .select()
      .single();
    if (error) throw new AppError(500, error.message);
    res.status(201).json({ data });
  }
);

// ── PATCH /admin/services/:id ──
adminRouter.patch('/services/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const updates: Record<string, unknown> = {};
  for (const field of ['name', 'slug', 'description', 'category', 'base_price', 'is_active']) {
    if (body[field] !== undefined) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) throw new AppError(400, 'No valid fields to update');

  const { data, error } = await adminClient.from('services').update(updates).eq('id', id).select().single();
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// ── DELETE /admin/services/:id ──
adminRouter.delete('/services/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await adminClient.from('services').delete().eq('id', id).select().single();
  if (error) throw new AppError(404, 'Service not found');
  res.json({ data });
});

// ── GET /admin/disputes ──
adminRouter.get('/disputes', async (req: Request, res: Response) => {
  const statusFilter = req.query.status as string | undefined;
  let query = adminClient
    .from('disputes')
    .select('*, order:orders(id, title, amount, status), raised_by_profile:profiles!raised_by(id, full_name, avatar_url), resolved_by_profile:profiles!resolved_by(id, full_name)')
    .order('created_at', { ascending: false });
  if (statusFilter) query = query.eq('status', statusFilter);
  const { data, error } = await query;
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// ── PATCH /admin/disputes/:id ──
adminRouter.patch('/disputes/:id',
  validate(z.object({ status: z.enum(['resolved', 'dismissed', 'under_review']), resolution: z.string().optional() })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, resolution } = req.body;
    const updateData: Record<string, unknown> = {
      status,
      resolved_by: req.user?.id,
      resolved_at: new Date().toISOString(),
    };
    if (resolution) updateData.resolution = resolution;

    const { data, error } = await adminClient.from('disputes').update(updateData).eq('id', id).select().single();
    if (error) throw new AppError(500, error.message);
    res.json({ data });
  }
);

// ── GET /admin/payouts ──
adminRouter.get('/payouts', async (req: Request, res: Response) => {
  const statusFilter = req.query.status as string | undefined;
  let query = adminClient.from('payouts').select('*, profile:profiles(id, full_name, avatar_url)').order('created_at', { ascending: false });
  if (statusFilter) query = query.eq('status', statusFilter);
  const { data, error } = await query;
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// ── GET /admin/settings ──
adminRouter.get('/settings', async (_req: Request, res: Response) => {
  const { data, error } = await adminClient.from('site_settings').select('*').order('key');
  if (error) throw new AppError(500, error.message);
  const settings: Record<string, unknown> = {};
  for (const row of data || []) {
    settings[row.key] = row.value;
  }
  res.json({ data: settings });
});

// ── PATCH /admin/settings ──
adminRouter.patch('/settings',
  validate(z.object({ key: z.string().min(1), value: z.any() })),
  auditLog('update_settings', 'site_settings', (req) => null),
  async (req: Request, res: Response) => {
    const { key, value } = req.body;
    await adminClient.from('site_settings').upsert({ key, value }, { onConflict: 'key' });
    res.json({ data: { key, value } });
  }
);

// ── GET /admin/manual-payments ──
adminRouter.get('/manual-payments', async (req: Request, res: Response) => {
  const statusFilter = req.query.status as string | undefined;
  let query = adminClient
    .from('manual_payments')
    .select('*, buyer:profiles!buyer_id(id, full_name, avatar_url), reviewed_by_profile:profiles!reviewed_by(id, full_name)')
    .order('created_at', { ascending: false });
  if (statusFilter) query = query.eq('status', statusFilter);
  const { data, error } = await query;
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// ── PATCH /admin/manual-payments/:id/approve ──
adminRouter.patch('/manual-payments/:id/approve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { admin_notes } = req.body || {};

  const { data: payment } = await adminClient.from('manual_payments').select('*').eq('id', id).single();
  if (!payment) throw new AppError(404, 'Payment not found');

  const { data, error } = await adminClient
    .from('manual_payments')
    .update({ status: 'approved', reviewed_by: req.user?.id, reviewed_at: new Date().toISOString(), admin_notes: admin_notes || null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new AppError(500, error.message);

  await adminClient.from('orders').update({ payment_status: 'paid' }).eq('id', payment.order_id);
  if (payment.payment_intent_id) {
    await adminClient.from('payment_intents').update({ status: 'success' }).eq('id', payment.payment_intent_id);
  }

  res.json({ data });
});

// ── PATCH /admin/manual-payments/:id/reject ──
adminRouter.patch('/manual-payments/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { admin_notes } = req.body || {};
  const { data, error } = await adminClient
    .from('manual_payments')
    .update({ status: 'rejected', reviewed_by: req.user?.id, reviewed_at: new Date().toISOString(), admin_notes: admin_notes || null })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// ── GET /admin/provider-bank-accounts ──
adminRouter.get('/provider-bank-accounts', async (req: Request, res: Response) => {
  const kycFilter = req.query.kyc_status as string | undefined;
  let query = adminClient.from('provider_bank_accounts').select('*, profile:profiles(id, full_name, avatar_url)').order('created_at', { ascending: false });
  if (kycFilter) query = query.eq('kyc_status', kycFilter);
  const { data, error } = await query;
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// ── PATCH /admin/provider-bank-accounts/:id/verify ──
adminRouter.patch('/provider-bank-accounts/:id/verify',
  validate(z.object({ kyc_status: z.enum(['verified', 'rejected']), kyc_notes: z.string().optional() })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { kyc_status, kyc_notes } = req.body;
    const { data, error } = await adminClient
      .from('provider_bank_accounts')
      .update({ kyc_status, verified_by: kyc_status === 'verified' ? req.user?.id : null, verified_at: kyc_status === 'verified' ? new Date().toISOString() : null, kyc_notes: kyc_notes || null })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new AppError(500, error.message);
    res.json({ data });
  }
);

// ── GET /admin/audit-log ──
adminRouter.get('/audit-log', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const { data, error } = await adminClient
    .from('admin_audit_log')
    .select('*, admin:profiles(id, full_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// ── GET /admin/listings — all marketplace listings ──
adminRouter.get('/listings', async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  let query = adminClient
    .from('marketplace_listings')
    .select('*, service:services(id, name, slug, category), provider:profiles(id, full_name, avatar_url)', { count: 'exact' });

  if (status) query = query.eq('status', status);
  const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw new AppError(500, error.message);
  res.json({ data, count, limit, offset });
});

// ── PATCH /admin/listings/:id — admin update listing ──
adminRouter.patch('/listings/:id',
  validate(z.object({
    status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
    reason: z.string().optional(),
  })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates: Record<string, unknown> = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.reason) updates.admin_reason = req.body.reason;
    if (Object.keys(updates).length === 0) throw new AppError(400, 'No fields to update');

    const { data: existing } = await adminClient.from('marketplace_listings').select('*, provider:profiles(id, full_name)').eq('id', id).single();
    if (!existing) throw new AppError(404, 'Listing not found');

    const { data, error } = await adminClient.from('marketplace_listings').update(updates).eq('id', id).select().single();
    if (error) throw new AppError(500, error.message);

    // Notify the owner
    if (req.body.status && req.body.status !== existing.status) {
      const reason = req.body.reason || 'No specific reason provided.';
      const statusLabel = (req.body.status as string).replace('_', ' ');
      await adminClient.from('notifications').insert({
        profile_id: existing.provider_id,
        title: `Listing ${statusLabel}`,
        message: `Your listing "${existing.title}" has been ${req.body.status === 'cancelled' ? 'removed' : 'updated to ' + req.body.status} by an admin. Reason: ${reason}`,
        type: 'system',
      }).maybeSingle();
    }

    res.json({ data });
  }
);

// ── DELETE /admin/listings/:id — admin delete listing ──
adminRouter.delete('/listings/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const reason = (req.query.reason as string) || '';

  const { data: existing } = await adminClient.from('marketplace_listings').select('*, provider:profiles(id, full_name)').eq('id', id).single();
  if (!existing) throw new AppError(404, 'Listing not found');

  const { data, error } = await adminClient.from('marketplace_listings').delete().eq('id', id).select().single();
  if (error) throw new AppError(500, error.message);

  // Notify the owner
  const reasonMsg = reason ? ` Reason: ${reason}` : '';
  await adminClient.from('notifications').insert({
    profile_id: existing.provider_id,
    title: 'Listing Deleted',
    message: `Your listing "${existing.title}" has been deleted by an admin.${reasonMsg}`,
    type: 'system',
  }).maybeSingle();

  res.json({ data });
});

// ── GET /admin/projects — all projects ──
adminRouter.get('/projects', async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  let query = adminClient
    .from('projects')
    .select('*, owner:profiles(id, full_name, avatar_url)')
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// ── PATCH /admin/projects/:id — admin update project ──
adminRouter.patch('/projects/:id',
  validate(z.object({ status: z.string().optional(), reason: z.string().optional() })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates: Record<string, unknown> = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.reason) updates.admin_reason = req.body.reason;
    if (Object.keys(updates).length === 0) throw new AppError(400, 'No fields to update');

    const { data: existing } = await adminClient.from('projects').select('*, owner:profiles(id, full_name)').eq('id', id).single();
    if (!existing) throw new AppError(404, 'Project not found');

    const { data, error } = await adminClient.from('projects').update(updates).eq('id', id).select().single();
    if (error) throw new AppError(500, error.message);

    if (req.body.status && req.body.status !== existing.status) {
      const reason = req.body.reason || 'No specific reason provided.';
      await adminClient.from('notifications').insert({
        profile_id: existing.owner_id,
        title: `Project ${req.body.status}`,
        message: `Your project "${existing.title}" has been updated to ${req.body.status} by an admin. Reason: ${reason}`,
        type: 'system',
      }).maybeSingle();
    }

    res.json({ data });
  }
);

// ── DELETE /admin/projects/:id — admin delete project ──
adminRouter.delete('/projects/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const reason = (req.query.reason as string) || '';

  const { data: existing } = await adminClient.from('projects').select('*, owner:profiles(id, full_name)').eq('id', id).single();
  if (!existing) throw new AppError(404, 'Project not found');

  const { data, error } = await adminClient.from('projects').delete().eq('id', id).select().single();
  if (error) throw new AppError(500, error.message);

  const reasonMsg = reason ? ` Reason: ${reason}` : '';
  await adminClient.from('notifications').insert({
    profile_id: existing.owner_id,
    title: 'Project Deleted',
    message: `Your project "${existing.title}" has been deleted by an admin.${reasonMsg}`,
    type: 'system',
  }).maybeSingle();

  res.json({ data });
});

// ── GET /admin/config ──
adminRouter.get('/config', async (_req: Request, res: Response) => {
  const { data, error } = await adminClient.from('platform_config').select('*').order('key');
  if (error) throw new AppError(500, error.message);
  const config: Record<string, unknown> = {};
  for (const row of data || []) {
    config[row.key] = row.value;
  }
  res.json({ data: config });
});

// ── PATCH /admin/config ──
adminRouter.patch('/config',
  validate(z.object({ key: z.string().min(1), value: z.any() })),
  async (req: Request, res: Response) => {
    const { key, value } = req.body;
    await adminClient.from('platform_config').upsert({ key, value }, { onConflict: 'key' });
    res.json({ data: { key, value } });
  }
);

// ════════════════════════════════════════
// ORGANIZATIONS (B2B)
// ════════════════════════════════════════

// ── GET /admin/orgs ──
adminRouter.get('/orgs', async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  let query = adminClient
    .from('organizations')
    .select('id, name, slug, industry, size, description, website_url, subscription_plan_id, subscription_starts_at, created_at, updated_at', { count: 'exact' });

  if (search) query = query.ilike('name', `%${search}%`);

  const { data: orgs, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new AppError(500, error.message);

  // Enrich with member counts and plan names
  const orgIds = (orgs || []).map((o: any) => o.id);

  const [memberCounts, plans] = await Promise.all([
    orgIds.length > 0
      ? adminClient
          .from('org_members')
          .select('org_id, count:org_id', { count: 'exact', head: true })
          .in('org_id', orgIds)
          .then(() =>
            // Manual counting since Supabase count with group is tricky
            Promise.all(orgIds.map((oid: string) =>
              adminClient
                .from('org_members')
                .select('id', { count: 'exact', head: true })
                .eq('org_id', oid)
                .then(r => ({ org_id: oid, count: r.count ?? 0 }))
            ))
          )
      : Promise.resolve([] as { org_id: string; count: number }[]),

    adminClient
      .from('subscription_plans')
      .select('id, name, slug'),
  ]);

  const planMap = new Map((plans.data || []).map((p: any) => [p.id, p]));
  const countMap = new Map(memberCounts.map((m: any) => [m.org_id, m.count]));

  const data = (orgs || []).map((org: any) => ({
    ...org,
    member_count: countMap.get(org.id) ?? 0,
    plan: planMap.get(org.subscription_plan_id) || null,
  }));

  res.json({ data, count, limit, offset });
});

// ── GET /admin/roles ──
adminRouter.get('/roles', async (_req: Request, res: Response) => {
  const { data, error } = await adminClient
    .from('roles')
    .select('*')
    .order('scope')
    .order('name');
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// ── POST /admin/roles ──
adminRouter.post('/roles',
  validate(z.object({
    name: z.string().min(1).max(100),
    scope: z.enum(['platform', 'org']),
    description: z.string().optional().default(''),
    permissions: z.record(z.boolean()).optional().default({}),
  })),
  async (req: Request, res: Response) => {
    const { name, scope, description, permissions } = req.body;
    const { data, error } = await adminClient
      .from('roles')
      .insert({ name, scope, description: description || null, permissions, is_system_role: false })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new AppError(409, `Role "${name}" with scope "${scope}" already exists`);
      throw new AppError(500, error.message);
    }
    res.status(201).json({ data });
  }
);

// ── PATCH /admin/roles/:id ──
adminRouter.patch('/roles/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;

  // Prevent renaming/descoping system roles
  if (body.name || body.scope) {
    const { data: existing } = await adminClient.from('roles').select('is_system_role').eq('id', id).single();
    if (existing?.is_system_role) throw new AppError(403, 'Cannot rename or change scope of system roles');
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.scope !== undefined) updates.scope = body.scope;
  if (body.description !== undefined) updates.description = body.description;
  if (body.permissions !== undefined) updates.permissions = body.permissions;
  if (Object.keys(updates).length === 0) throw new AppError(400, 'No valid fields to update');
  updates.updated_at = new Date().toISOString();

  const { data, error } = await adminClient.from('roles').update(updates).eq('id', id).select().single();
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// ── DELETE /admin/roles/:id ──
adminRouter.delete('/roles/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data: existing } = await adminClient.from('roles').select('is_system_role').eq('id', id).single();
  if (!existing) throw new AppError(404, 'Role not found');
  if (existing.is_system_role) throw new AppError(403, 'Cannot delete system roles');

  const { data, error } = await adminClient.from('roles').delete().eq('id', id).select().single();
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});
