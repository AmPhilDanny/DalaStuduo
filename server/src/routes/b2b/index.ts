import { Router, Request, Response } from 'express';
import multer from 'multer';
import { adminClient } from '../../lib/supabase-admin.js';
import { AppError } from '../../middleware/error.js';
import { requirePermission } from '../../middleware/auth.js';

const verificationUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const b2bRouter: Router = Router();

// All B2B routes require access_b2b permission on the user's platform role
b2bRouter.use(requirePermission('access_b2b'));

const ORG_ADMIN_ROLES = ['owner', 'admin'] as const;
const ORG_MANAGER_ROLES = ['owner', 'admin', 'manager'] as const;
const ORG_ROLES = ['owner', 'admin', 'manager', 'member', 'viewer'] as const;
const INVITE_ROLES = ['admin', 'manager', 'member', 'viewer'] as const;
const APPLICATION_STATUSES = ['pending', 'reviewed', 'interviewed', 'offer', 'accepted', 'rejected'] as const;
const CONTRACT_TYPES = ['msa', 'sow', 'fixed_price', 'milestone_based'] as const;
const BILLING_CYCLES = ['monthly', 'yearly'] as const;
const CONTRACT_STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['signed', 'cancelled'],
  signed: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// ── Helpers ──

async function getUserOrg(userId: string) {
  const { data: userData } = await adminClient.auth.admin.getUserById(userId);
  const currentOrgId = (userData?.user?.app_metadata as Record<string, any>)?.current_org_id;

  let query = adminClient
    .from('org_members')
    .select('org_id, role, organizations:org_id(*)')
    .eq('user_id', userId);
  if (currentOrgId) query = query.eq('org_id', currentOrgId);

  const { data: member } = await query.maybeSingle();
  if (!member) return null;
  return { org: member.organizations as Record<string, any>, role: member.role };
}

function requireRole(role: string, allowed: readonly string[]): void {
  if (!allowed.includes(role as any)) throw new AppError(403, 'Insufficient permissions');
}

async function logAudit(adminId: string, action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) {
  try {
    await adminClient.from('admin_audit_log').insert({ admin_id: adminId, action, entity_type: entityType, entity_id: entityId, details: details || {} });
  } catch { /* non-fatal */ }
}

// ════════════════════════════════════════
// ORG
// ════════════════════════════════════════

// GET /org
b2bRouter.get('/org', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  res.json(userOrg);
});

// POST /org — create organization
b2bRouter.post('/org', async (req: Request, res: Response) => {
  const { name, industry, size, description, website_url } = req.body;
  if (!name) throw new AppError(400, 'Organization name is required');

  const existing = await getUserOrg(req.user!.id);
  if (existing) throw new AppError(409, 'User already belongs to an organization');

  const { data: freePlan } = await adminClient.from('subscription_plans').select('id').eq('slug', 'free').single();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + req.user!.id.substring(0, 8);

  const { data: org, error: orgErr } = await adminClient
    .from('organizations')
    .insert({ name, slug, industry: industry || null, size: size || null, description: description || null, website_url: website_url || null, subscription_plan_id: freePlan?.id || null, subscription_starts_at: new Date().toISOString() })
    .select()
    .single();
  if (orgErr) throw new AppError(500, orgErr.message);

  const { error: memberErr } = await adminClient.from('org_members').insert({ org_id: org.id, user_id: req.user!.id, role: 'owner' });
  if (memberErr) throw new AppError(500, memberErr.message);

  await logAudit(req.user!.id, 'create_org', 'organizations', org.id, { name });
  res.status(201).json({ data: org });
});

// PATCH /org
b2bRouter.patch('/org', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_ADMIN_ROLES);

  const body = req.body;
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.industry !== undefined) updates.industry = body.industry;
  if (body.size !== undefined) updates.size = body.size;
  if (body.description !== undefined) updates.description = body.description;
  if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
  if (body.website_url !== undefined) updates.website_url = body.website_url;
  if (Object.keys(updates).length === 0) throw new AppError(400, 'No fields to update');

  const { data: org, error } = await adminClient.from('organizations').update(updates).eq('id', userOrg.org.id).select().single();
  if (error) throw new AppError(500, error.message);
  await logAudit(req.user!.id, 'update_org', 'organizations', org.id, updates);
  res.json({ data: org });
});

// GET /org/members
b2bRouter.get('/org/members', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');

  const { data: members, error } = await adminClient
    .from('org_members')
    .select('id, role, user_id, title, joined_at, created_at')
    .eq('org_id', userOrg.org.id)
    .order('joined_at');
  if (error) throw new AppError(500, error.message);

  // Fetch user profiles separately (no FK relationship on user_id in schema)
  if (members && members.length > 0) {
    const userIds = members.map(m => m.user_id);
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, full_name, avatar_url, email, role')
      .in('id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const enriched = members.map(m => ({
      ...m,
      user: profileMap.get(m.user_id) || null,
    }));
    return res.json({ data: enriched });
  }

  res.json({ data: members || [] });
});

// POST /org/members/invite
b2bRouter.post('/org/members/invite', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_ADMIN_ROLES);

  const { email, role: inviteRole, message } = req.body;
  if (!email || !inviteRole) throw new AppError(400, 'Email and role are required');
  if (!INVITE_ROLES.includes(inviteRole as any)) throw new AppError(400, 'Invalid role');

  const { data: existingInvite } = await adminClient.from('org_invites').select('id, status').eq('org_id', userOrg.org.id).eq('email', email).eq('status', 'pending').maybeSingle();
  if (existingInvite) throw new AppError(409, 'A pending invite already exists for this email');

  const { data: invite, error } = await adminClient.from('org_invites').insert({ org_id: userOrg.org.id, email, role: inviteRole, invited_by: req.user!.id, message: message || null }).select().single();
  if (error) throw new AppError(500, error.message);
  await logAudit(req.user!.id, 'invite_member', 'org_invites', invite.id, { email, role: inviteRole });
  res.status(201).json({ data: invite });
});

// POST /org/invites/accept
b2bRouter.post('/org/invites/accept', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) throw new AppError(400, 'Invite token required');

  const { data: invite } = await adminClient.from('org_invites').select('*, organizations!inner(name)').eq('token', token).single();
  if (!invite) throw new AppError(404, 'Invalid or expired invite token');
  if (invite.status !== 'pending') throw new AppError(400, `Invite already ${invite.status}`);
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    await adminClient.from('org_invites').update({ status: 'expired' }).eq('id', invite.id);
    throw new AppError(400, 'Invite has expired');
  }

  const { data: existing } = await adminClient.from('org_members').select('id').eq('org_id', invite.org_id).eq('user_id', req.user!.id).maybeSingle();
  if (existing) throw new AppError(409, 'Already a member');

  const { data: member, error } = await adminClient.from('org_members').insert({ org_id: invite.org_id, user_id: req.user!.id, role: invite.role }).select().single();
  if (error) throw new AppError(500, error.message);

  await adminClient.from('org_invites').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', invite.id);
  await logAudit(req.user!.id, 'accept_invite', 'org_members', member.id, { org_id: invite.org_id, org_name: (invite as any).organizations?.name, role: invite.role });
  res.json({ data: member });
});

// GET /org/memberships
b2bRouter.get('/org/memberships', async (req: Request, res: Response) => {
  const { data, error } = await adminClient.from('org_members').select('org_id, role, organizations:org_id(id, name, slug, logo_url)').eq('user_id', req.user!.id);
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// POST /org/switch
b2bRouter.post('/org/switch', async (req: Request, res: Response) => {
  const { org_id } = req.body;
  if (!org_id) throw new AppError(400, 'org_id required');

  const { data: membership } = await adminClient.from('org_members').select('id, role').eq('org_id', org_id).eq('user_id', req.user!.id).maybeSingle();
  if (!membership) throw new AppError(403, 'Not a member of this organization');

  const { error: updateErr } = await adminClient.auth.admin.updateUserById(req.user!.id, { app_metadata: { current_org_id: org_id } });
  if (updateErr) throw new AppError(500, updateErr.message);
  res.json({ data: { org_id, role: membership.role } });
});

// PATCH /org/members/:id/role
b2bRouter.patch('/org/members/:id/role', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_ADMIN_ROLES);

  const { role: newRole } = req.body;
  if (!ORG_ROLES.includes(newRole as any)) throw new AppError(400, 'Invalid role');

  const { data: target } = await adminClient.from('org_members').select('id, role, user_id').eq('id', req.params.id).eq('org_id', userOrg.org.id).single();
  if (!target) throw new AppError(404, 'Member not found');
  if (target.role === 'owner' && userOrg.role !== 'owner') throw new AppError(403, 'Only owners can change owner role');

  const { data, error } = await adminClient.from('org_members').update({ role: newRole }).eq('id', req.params.id).select().single();
  if (error) throw new AppError(500, error.message);
  await logAudit(req.user!.id, 'change_member_role', 'org_members', req.params.id as string, { new_role: newRole });
  res.json({ data });
});

// GET /org/invites
b2bRouter.get('/org/invites', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  const { data, error } = await adminClient.from('org_invites').select('*, inviter:invited_by(id, full_name, avatar_url)').eq('org_id', userOrg.org.id).order('created_at', { ascending: false });
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// DELETE /org/invites/:id (cancel)
b2bRouter.delete('/org/invites/:id', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_ADMIN_ROLES);
  const { error } = await adminClient.from('org_invites').update({ status: 'cancelled' }).eq('id', req.params.id).eq('org_id', userOrg.org.id);
  if (error) throw new AppError(500, error.message);
  res.json({ success: true });
});

// DELETE /org/members/:id
b2bRouter.delete('/org/members/:id', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_ADMIN_ROLES);

  const { data: targetMember } = await adminClient.from('org_members').select('id, role, user_id').eq('id', req.params.id).eq('org_id', userOrg.org.id).single();
  if (!targetMember) throw new AppError(404, 'Member not found');

  if (targetMember.role === 'owner') {
    const { count } = await adminClient.from('org_members').select('id', { count: 'exact', head: true }).eq('org_id', userOrg.org.id).eq('role', 'owner');
    if (count && count <= 1) throw new AppError(403, 'Cannot remove the last owner');
  }

  const { error } = await adminClient.from('org_members').delete().eq('id', req.params.id);
  if (error) throw new AppError(500, error.message);
  await logAudit(req.user!.id, 'remove_member', 'org_members', req.params.id as string);
  res.json({ success: true });
});

// ════════════════════════════════════════
// SUBSCRIPTION
// ════════════════════════════════════════

// GET /subscription
b2bRouter.get('/subscription', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  const org = userOrg.org;

  if (!org.subscription_plan_id) {
    const { data: freePlan } = await adminClient.from('subscription_plans').select('*').eq('slug', 'free').single();
    return res.json({ plan: freePlan, status: 'active', starts_at: org.subscription_starts_at, ends_at: null });
  }

  const { data: plan } = await adminClient.from('subscription_plans').select('*').eq('id', org.subscription_plan_id).single();
  const isExpired = org.subscription_ends_at && new Date(org.subscription_ends_at) < new Date();
  res.json({ plan, status: isExpired ? 'expired' : 'active', starts_at: org.subscription_starts_at, ends_at: org.subscription_ends_at });
});

// POST /subscription/change
b2bRouter.post('/subscription/change', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_ADMIN_ROLES);

  const { plan_slug, billing_cycle } = req.body;
  if (!plan_slug || !BILLING_CYCLES.includes(billing_cycle || 'monthly' as any)) throw new AppError(400, 'plan_slug and billing_cycle required');

  const { data: plan } = await adminClient.from('subscription_plans').select('id, price_monthly, price_yearly').eq('slug', plan_slug).eq('is_active', true).single();
  if (!plan) throw new AppError(400, 'Invalid or inactive plan');

  const price = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const org = userOrg.org;

  const { data: updated, error } = await adminClient.from('organizations').update({
    subscription_plan_id: plan.id,
    subscription_starts_at: new Date().toISOString(),
    subscription_ends_at: price === 0 ? null : new Date(Date.now() + (billing_cycle === 'yearly' ? 365 : 30) * 86400000).toISOString(),
  }).eq('id', org.id).select().single();

  if (error) throw new AppError(500, error.message);
  await logAudit(req.user!.id, 'change_subscription', 'organizations', org.id, { plan_slug, billing_cycle, price });

  await adminClient.from('billing_history').insert({
    org_id: org.id, from_plan_id: org.subscription_plan_id, to_plan_id: plan.id,
    change_type: 'plan_change', amount: price, billing_cycle, changed_by: req.user!.id,
  }).maybeSingle();

  res.json({ data: updated });
});

// ════════════════════════════════════════
// TALENT SEARCH
// ════════════════════════════════════════

// GET /talent/search
b2bRouter.get('/talent/search', async (req: Request, res: Response) => {
  const skills = req.query.skills as string | undefined;
  const location = req.query.location as string | undefined;
  const availability = req.query.availability as string | undefined;
  const search = req.query.q as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const offset = parseInt(req.query.offset as string) || 0;

  let query = adminClient.from('profiles').select('*', { count: 'exact' }).eq('role', 'student').order('created_at', { ascending: false });
  if (search) query = query.or(`full_name.ilike.%${search}%,headline.ilike.%${search}%,bio.ilike.%${search}%`);
  if (skills) for (const skill of skills.split(',').map(s => s.trim())) query = query.contains('skills', [skill]);
  if (location) query = query.ilike('location', `%${location}%`);
  if (availability && ['open_to_work', 'open_to_collab', 'not_available'].includes(availability)) query = query.eq('availability', availability);

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) throw new AppError(500, error.message);
  res.json({ data, count, limit, offset });
});

// GET /talent/saved-searches
b2bRouter.get('/talent/saved-searches', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  const { data, error } = await adminClient.from('saved_searches').select('*').eq('org_id', userOrg.org.id).eq('saved_by', req.user!.id).order('created_at', { ascending: false });
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// POST /talent/saved-searches
b2bRouter.post('/talent/saved-searches', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  const { name, filters } = req.body;
  if (!name) throw new AppError(400, 'Name is required');
  const { data, error } = await adminClient.from('saved_searches').insert({ org_id: userOrg.org.id, saved_by: req.user!.id, name, filters: filters || {} }).select().single();
  if (error) throw new AppError(500, error.message);
  res.status(201).json({ data });
});

// DELETE /talent/saved-searches/:id
b2bRouter.delete('/talent/saved-searches/:id', async (req: Request, res: Response) => {
  const { error } = await adminClient.from('saved_searches').delete().eq('id', req.params.id).eq('saved_by', req.user!.id);
  if (error) throw new AppError(500, error.message);
  res.json({ success: true });
});

// GET /talent/lists
b2bRouter.get('/talent/lists', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  const { data, error } = await adminClient.from('talent_lists').select('*, saved_talent(count), created_by(id, full_name, avatar_url)').eq('org_id', userOrg.org.id).order('created_at', { ascending: false });
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// POST /talent/lists
b2bRouter.post('/talent/lists', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  const { name, description } = req.body;
  if (!name) throw new AppError(400, 'Name is required');
  const { data, error } = await adminClient.from('talent_lists').insert({ org_id: userOrg.org.id, name, description: description || null, created_by: req.user!.id }).select().single();
  if (error) {
    if (error.code === '23505') throw new AppError(409, 'A list with this name already exists');
    throw new AppError(500, error.message);
  }
  res.status(201).json({ data });
});

// DELETE /talent/lists/:id
b2bRouter.delete('/talent/lists/:id', async (req: Request, res: Response) => {
  const { error } = await adminClient.from('talent_lists').delete().eq('id', req.params.id);
  if (error) throw new AppError(500, error.message);
  res.json({ success: true });
});

// GET /talent/lists/:id/talent
b2bRouter.get('/talent/lists/:id/talent', async (req: Request, res: Response) => {
  const { data, error } = await adminClient.from('saved_talent').select('*, talent: talent_id(id, full_name, avatar_url, headline, skills, location, availability)').eq('list_id', req.params.id).order('created_at', { ascending: false });
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// POST /talent/lists/:id/talent
b2bRouter.post('/talent/lists/:id/talent', async (req: Request, res: Response) => {
  const { talent_id, notes } = req.body;
  if (!talent_id) throw new AppError(400, 'talent_id is required');
  const { data, error } = await adminClient.from('saved_talent').insert({ list_id: req.params.id, talent_id, notes: notes || null, saved_by: req.user!.id }).select().single();
  if (error) {
    if (error.code === '23505') throw new AppError(409, 'Talent already in this list');
    throw new AppError(500, error.message);
  }
  res.status(201).json({ data });
});

// DELETE /talent/lists/:id/talent/:talentId
b2bRouter.delete('/talent/lists/:id/talent/:talentId', async (req: Request, res: Response) => {
  const { error } = await adminClient.from('saved_talent').delete().eq('list_id', req.params.id).eq('talent_id', req.params.talentId);
  if (error) throw new AppError(500, error.message);
  res.json({ success: true });
});

// ════════════════════════════════════════
// JOBS & HIRING
// ════════════════════════════════════════

// POST /jobs/bulk
b2bRouter.post('/jobs/bulk', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_MANAGER_ROLES);

  const { jobs } = req.body;
  if (!jobs || !Array.isArray(jobs) || jobs.length === 0) throw new AppError(400, 'jobs array required');
  if (jobs.length > 50) throw new AppError(400, 'Maximum 50 jobs per batch');

  const orgId = userOrg.org.id;
  const results: { success: boolean; job?: any; error?: string }[] = [];
  const validJobs: any[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (!job.title || !job.description || !job.type) {
      results.push({ success: false, error: `Row ${i + 1}: Missing required fields` });
      continue;
    }
    if (!['part-time', 'internship'].includes(job.type)) {
      results.push({ success: false, error: `Row ${i + 1}: Invalid type` });
      continue;
    }
    validJobs.push({
      company_id: req.user!.id, org_id: orgId, title: job.title, description: job.description,
      type: job.type, location: job.location || null, salary_range: job.salary_range || null,
      requirements: job.requirements || null, is_active: job.is_active !== undefined ? job.is_active : true,
    });
  }

  if (validJobs.length > 0) {
    const { data: inserted, error } = await adminClient.from('jobs').insert(validJobs).select();
    if (error) throw new AppError(500, error.message);
    for (const j of inserted || []) results.push({ success: true, job: j });
  }

  res.status(201).json({ results, total: jobs.length, succeeded: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length });
});

// PATCH /hiring/pipeline/:applicationId
b2bRouter.patch('/hiring/pipeline/:applicationId', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_MANAGER_ROLES);

  const { status } = req.body;
  if (!status || !APPLICATION_STATUSES.includes(status as any)) throw new AppError(400, `Invalid status`);

  const { data: app } = await adminClient.from('applications').select('id, job_id, jobs!inner(org_id)').eq('id', req.params.applicationId).eq('jobs.org_id', userOrg.org.id).single();
  if (!app) throw new AppError(404, 'Application not found');

  const { data, error } = await adminClient.from('applications').update({ status }).eq('id', req.params.applicationId).select().single();
  if (error) throw new AppError(500, error.message);
  await logAudit(req.user!.id, 'pipeline_update', 'applications', req.params.applicationId as string, { status });
  res.json({ data });
});

// GET /hiring/applications
b2bRouter.get('/hiring/applications', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');

  const { data, error } = await adminClient
    .from('applications')
    .select('id, job_id, student_id, status, cover_letter, resume_url, created_at, jobs!inner(id, title, type, location), profiles:student_id(id, full_name, avatar_url, headline, skills, location)')
    .eq('jobs.org_id', userOrg.org.id)
    .order('created_at', { ascending: false });
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// POST /hiring/pipeline/bulk
b2bRouter.post('/hiring/pipeline/bulk', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_MANAGER_ROLES);

  const { application_ids, status } = req.body;
  if (!application_ids || !Array.isArray(application_ids) || application_ids.length === 0 || !status) throw new AppError(400, 'application_ids and status required');
  if (!APPLICATION_STATUSES.includes(status as any)) throw new AppError(400, 'Invalid status');

  const { data, error } = await adminClient.from('applications').update({ status }).in('id', application_ids).select();
  if (error) throw new AppError(500, error.message);
  res.json({ data, count: data?.length || 0 });
});

// ════════════════════════════════════════
// CONTRACTS
// ════════════════════════════════════════

// GET /contracts
b2bRouter.get('/contracts', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  const { data, error } = await adminClient.from('contracts').select('*, talent:talent_id(id, full_name, avatar_url, headline), milestones:contract_milestones(count)').eq('org_id', userOrg.org.id).order('created_at', { ascending: false });
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// POST /contracts
b2bRouter.post('/contracts', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_MANAGER_ROLES);

  const { talent_id, title, contract_type, description, total_value, currency, terms, starts_at, ends_at } = req.body;
  if (!talent_id || !title || !contract_type) throw new AppError(400, 'talent_id, title, and contract_type required');
  if (!CONTRACT_TYPES.includes(contract_type as any)) throw new AppError(400, 'Invalid contract_type');

  const { data, error } = await adminClient.from('contracts').insert({
    org_id: userOrg.org.id, talent_id, title, contract_type, description: description || null,
    total_value: total_value ?? 0, currency: currency || 'NGN', terms: terms || {},
    starts_at: starts_at || null, ends_at: ends_at || null, created_by: req.user!.id,
  }).select().single();

  if (error) throw new AppError(500, error.message);
  await logAudit(req.user!.id, 'create_contract', 'contracts', data.id, { title, contract_type });
  res.status(201).json({ data });
});

// GET /contracts/:id
b2bRouter.get('/contracts/:id', async (req: Request, res: Response) => {
  const { data, error } = await adminClient.from('contracts').select('*, talent:talent_id(*), milestones:contract_milestones(*)').eq('id', req.params.id).single();
  if (error || !data) throw new AppError(404, 'Contract not found');
  res.json({ data });
});

// PATCH /contracts/:id
b2bRouter.patch('/contracts/:id', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_MANAGER_ROLES);

  const body = req.body;
  const allowed = ['title', 'description', 'total_value', 'currency', 'terms', 'starts_at', 'ends_at'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) if (body[key] !== undefined) updates[key] = body[key];

  const { data, error } = await adminClient.from('contracts').update(updates).eq('id', req.params.id).eq('org_id', userOrg.org.id).select().single();
  if (error) throw new AppError(500, error.message);
  res.json({ data });
});

// POST /contracts/:id/status — transition contract status
b2bRouter.post('/contracts/:id/status', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');

  const { status: newStatus } = req.body;
  const { data: contract } = await adminClient.from('contracts').select('id, status, org_id, talent_id').eq('id', req.params.id).single();
  if (!contract) throw new AppError(404, 'Contract not found');

  const allowedNext = CONTRACT_STATUS_TRANSITIONS[contract.status] || [];
  if (!allowedNext.includes(newStatus)) throw new AppError(400, `Cannot transition from '${contract.status}' to '${newStatus}'`);

  const isOrgMember = userOrg.org && userOrg.org.id === contract.org_id;
  const isTalent = contract.talent_id === req.user!.id;
  const canTransition =
    (newStatus === 'signed' && (isOrgMember || isTalent)) ||
    (newStatus === 'active' && isOrgMember) ||
    (newStatus === 'completed' && (isOrgMember || isTalent)) ||
    (newStatus === 'cancelled' && (isOrgMember || isTalent));

  if (!canTransition) throw new AppError(403, 'Insufficient permissions for this status transition');

  const { data, error } = await adminClient.from('contracts').update({ status: newStatus }).eq('id', req.params.id).select().single();
  if (error) throw new AppError(500, error.message);

  // If completed, auto-update service fee and provider payout status
  if (newStatus === 'completed') {
    await adminClient.from('contracts').update({ completed_at: new Date().toISOString() }).eq('id', req.params.id);
  }

  await logAudit(req.user!.id, 'contract_status_change', 'contracts', req.params.id as string, { new_status: newStatus });
  res.json({ data });
});

// ════════════════════════════════════════
// ORG VERIFICATION
// ════════════════════════════════════════

// POST /verification/upload — upload a verification document
b2bRouter.post('/verification/upload', verificationUpload.single('file'), async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_ADMIN_ROLES);

  const f = (req as any).file as { originalname: string; buffer: Buffer; mimetype: string } | undefined;
  if (!f) throw new AppError(400, 'No file provided');

  const fileName = `${Date.now()}-${f.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = `verifications/${userOrg.org.id}/${fileName}`;

  const { error: uploadError } = await adminClient.storage.from('org-documents').upload(filePath, f.buffer, {
    contentType: f.mimetype,
    upsert: true,
  });

  if (uploadError) {
    // Fallback to site-assets bucket if org-documents doesn't exist
    const { error: uploadError2, data } = await adminClient.storage.from('site-assets').upload(filePath, f.buffer, {
      contentType: f.mimetype,
      upsert: true,
    });
    if (uploadError2) throw new AppError(500, uploadError2.message);
    const { data: urlData } = adminClient.storage.from('site-assets').getPublicUrl(filePath);
    return res.json({ data: { url: urlData?.publicUrl || null, path: filePath } });
  }

  const { data: urlData } = adminClient.storage.from('org-documents').getPublicUrl(filePath);
  res.json({ data: { url: urlData?.publicUrl || null, path: filePath } });
});

// GET /verification — get current org's verification status
b2bRouter.get('/verification', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');

  const { data, error } = await adminClient
    .from('org_verifications')
    .select('*')
    .eq('org_id', userOrg.org.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') {
      return res.json({ data: null });
    }
    throw new AppError(500, error.message);
  }

  res.json({ data: data || null });
});

// POST /verification — submit a verification request
b2bRouter.post('/verification', async (req: Request, res: Response) => {
  const userOrg = await getUserOrg(req.user!.id);
  if (!userOrg) throw new AppError(404, 'No organization found');
  requireRole(userOrg.role, ORG_ADMIN_ROLES);

  const { business_name, registration_number, tax_id, document_urls } = req.body;
  if (!business_name) throw new AppError(400, 'Business name is required');

  // Check for existing pending verification
  const { data: existing } = await adminClient
    .from('org_verifications')
    .select('id, status')
    .eq('org_id', userOrg.org.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) throw new AppError(409, 'A pending verification request already exists');

  const { data, error } = await adminClient
    .from('org_verifications')
    .insert({
      org_id: userOrg.org.id,
      business_name,
      registration_number: registration_number || null,
      tax_id: tax_id || null,
      document_urls: document_urls || [],
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new AppError(500, error.message);
  res.status(201).json({ data });
});
