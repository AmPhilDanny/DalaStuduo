import { Router, Request, Response } from 'express';
import { adminClient } from '../../lib/supabase-admin.js';
import { AppError } from '../../middleware/error.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

export const projectsRouter: Router = Router();

function getDb(req: Request) {
  return req.supabaseClient || adminClient;
}

function requireUser(req: Request, res: Response): boolean {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  return true;
}

// ════════════════════════════════════════
// PROJECTS
// ════════════════════════════════════════

// GET / — list all projects (public)
projectsRouter.get('/', async (req: Request, res: Response) => {
  const supabase = getDb(req);

  const { data, error } = await supabase
    .from('projects')
    .select('*, profiles:owner_id(id, full_name, avatar_url), project_roles(id, role_title, is_filled)')
    .order('created_at', { ascending: false });

  if (error) throw new AppError(500, error.message);
  res.json({ data: data || [] });
});

// GET /:id — single project detail (public)
projectsRouter.get('/:id', async (req: Request, res: Response) => {
  const supabase = getDb(req);

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*, profiles:owner_id(id, full_name, avatar_url)')
    .eq('id', req.params.id)
    .single();
  if (projectError) throw new AppError(404, 'Project not found');

  const { data: roles } = await supabase
    .from('project_roles')
    .select('*')
    .eq('project_id', req.params.id);
  if (!roles) throw new AppError(500, 'Failed to load project roles');

  const { data: members } = await supabase
    .from('project_members')
    .select('*, profiles:member_id(id, full_name, avatar_url)')
    .eq('project_id', req.params.id);

  let applications = null;
  let myApplications = null;

  if (req.user) {
    // Owner can see all applications
    if (req.user.id === project.owner_id) {
      const { data: apps } = await supabase
        .from('project_applications')
        .select('*, profiles:applicant_id(id, full_name, avatar_url)')
        .eq('project_id', req.params.id);
      applications = apps || [];
    }
    // Current user's own applications
    const { data: mine } = await supabase
      .from('project_applications')
      .select('*')
      .eq('project_id', req.params.id)
      .eq('applicant_id', req.user.id);
    myApplications = mine || [];
  }

  res.json({ data: { ...project, roles, members, applications, myApplications } });
});

// GET /:id/roles — project roles (public, used separately)
projectsRouter.get('/:id/roles', async (req: Request, res: Response) => {
  const supabase = getDb(req);
  const { data, error } = await supabase
    .from('project_roles')
    .select('*')
    .eq('project_id', req.params.id);
  if (error) throw new AppError(500, error.message);
  res.json({ data: data || [] });
});

// POST / — create a new project (auth required)
const createProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  project_type: z.string().optional(),
  roles: z.array(z.object({
    role_title: z.string().min(1),
    description: z.string().optional(),
    is_filled: z.boolean().optional().default(false),
  })).optional(),
});

projectsRouter.post('/',
  validate(createProjectSchema),
  async (req: Request, res: Response) => {
    if (!requireUser(req, res)) return;
    const supabase = getDb(req);
    const { title, description, project_type, roles } = req.body;

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        owner_id: req.user!.id,
        title, description,
        project_type: project_type || null,
      })
      .select()
      .single();
    if (projectError) throw new AppError(500, projectError.message);

    // Create roles if provided
    if (roles && roles.length > 0) {
      const { error: rolesError } = await supabase
        .from('project_roles')
        .insert(roles.map((r: any) => ({
          project_id: project.id,
          role_title: r.role_title,
          description: r.description || null,
          is_filled: r.is_filled ?? false,
        })));
      if (rolesError) throw new AppError(500, rolesError.message);
    }

    res.status(201).json({ data: project });
  }
);

// POST /:id/apply — apply for a project role (auth required)
const applySchema = z.object({
  role_id: z.string().uuid(),
  message: z.string().optional(),
});

projectsRouter.post('/:id/apply',
  validate(applySchema),
  async (req: Request, res: Response) => {
    if (!requireUser(req, res)) return;
    const supabase = getDb(req);
    const { role_id, message } = req.body;

    const { data: project } = await supabase.from('projects').select('id').eq('id', req.params.id).maybeSingle();
    if (!project) throw new AppError(404, 'Project not found');

    const { data: existing } = await supabase
      .from('project_applications')
      .select('id')
      .eq('project_id', req.params.id)
      .eq('applicant_id', req.user!.id)
      .eq('role_id', role_id)
      .maybeSingle();
    if (existing) throw new AppError(409, 'You have already applied for this role');

    const { data, error } = await supabase
      .from('project_applications')
      .insert({
        project_id: req.params.id,
        role_id,
        applicant_id: req.user!.id,
        message: message || null,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw new AppError(500, error.message);
    res.status(201).json({ data });
  }
);

// POST /:id/decide — owner approves/rejects an application (auth required, owner only)
const decideSchema = z.object({
  application_id: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
});

projectsRouter.post('/:id/decide',
  validate(decideSchema),
  async (req: Request, res: Response) => {
    if (!requireUser(req, res)) return;
    const supabase = getDb(req);

    // Verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', req.params.id)
      .single();
    if (!project) throw new AppError(404, 'Project not found');
    if (project.owner_id !== req.user!.id) throw new AppError(403, 'Only the project owner can decide on applications');

    const { application_id, status } = req.body;

    // Update the application status
    const { error: appError } = await supabase
      .from('project_applications')
      .update({ status })
      .eq('id', application_id);
    if (appError) throw new AppError(500, appError.message);

    // If approved, add as member and fill the role
    if (status === 'approved') {
      const { data: app } = await supabase
        .from('project_applications')
        .select('*, project_roles!inner(role_title)')
        .eq('id', application_id)
        .single();

      if (app) {
        await supabase
          .from('project_members')
          .insert({ project_id: req.params.id, member_id: app.applicant_id, role: (app as any).project_roles?.role_title || null });

        await supabase
          .from('project_roles')
          .update({ is_filled: true })
          .eq('id', app.role_id);
      }
    }

    res.json({ success: true });
  }
);
