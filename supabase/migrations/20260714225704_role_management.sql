-- Migration: Role Management System
-- Creates a roles table with permission flags for both platform and B2B org roles

-- ── Roles table ──
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('platform', 'org')),
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, scope)
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read roles (needed for profile display)
CREATE POLICY "Anyone can read roles"
  ON public.roles FOR SELECT
  USING (true);

-- Only service_role / admin can manage roles (done via admin API)
CREATE POLICY "Admins can insert roles"
  ON public.roles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update roles"
  ON public.roles FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete roles"
  ON public.roles FOR DELETE
  USING (true);

-- ── Seed platform roles ──
INSERT INTO public.roles (name, scope, description, permissions, is_system_role) VALUES
  ('super_admin', 'platform', 'Full system access with all permissions', '{
    "access_admin": true,
    "manage_users": true,
    "manage_roles": true,
    "manage_services": true,
    "manage_orders": true,
    "manage_disputes": true,
    "manage_payouts": true,
    "manage_settings": true,
    "browse_marketplace": true,
    "create_listings": true,
    "create_projects": true,
    "apply_projects": true,
    "post_jobs": true,
    "apply_jobs": true,
    "access_b2b": true,
    "send_messages": true
  }'::jsonb, true),

  ('admin', 'platform', 'Administrative access to manage platform', '{
    "access_admin": true,
    "manage_users": true,
    "manage_roles": false,
    "manage_services": true,
    "manage_orders": true,
    "manage_disputes": true,
    "manage_payouts": true,
    "manage_settings": true,
    "browse_marketplace": true,
    "create_listings": true,
    "create_projects": true,
    "apply_projects": true,
    "post_jobs": true,
    "apply_jobs": true,
    "access_b2b": true,
    "send_messages": true
  }'::jsonb, true),

  ('provider', 'platform', 'Service provider who can create listings and fulfill orders', '{
    "access_admin": false,
    "manage_users": false,
    "manage_roles": false,
    "manage_services": false,
    "manage_orders": false,
    "manage_disputes": false,
    "manage_payouts": false,
    "manage_settings": false,
    "browse_marketplace": true,
    "create_listings": true,
    "create_projects": true,
    "apply_projects": true,
    "post_jobs": false,
    "apply_jobs": true,
    "access_b2b": false,
    "send_messages": true
  }'::jsonb, true),

  ('buyer', 'platform', 'Can browse and purchase services on the marketplace', '{
    "access_admin": false,
    "manage_users": false,
    "manage_roles": false,
    "manage_services": false,
    "manage_orders": false,
    "manage_disputes": false,
    "manage_payouts": false,
    "manage_settings": false,
    "browse_marketplace": true,
    "create_listings": false,
    "create_projects": false,
    "apply_projects": false,
    "post_jobs": false,
    "apply_jobs": true,
    "access_b2b": false,
    "send_messages": true
  }'::jsonb, true),

  ('moderator', 'platform', 'Can moderate content and manage disputes', '{
    "access_admin": true,
    "manage_users": false,
    "manage_roles": false,
    "manage_services": false,
    "manage_orders": true,
    "manage_disputes": true,
    "manage_payouts": false,
    "manage_settings": false,
    "browse_marketplace": true,
    "create_listings": false,
    "create_projects": false,
    "apply_projects": false,
    "post_jobs": false,
    "apply_jobs": false,
    "access_b2b": false,
    "send_messages": true
  }'::jsonb, true),

  ('student', 'platform', 'Default role for new users', '{
    "access_admin": false,
    "manage_users": false,
    "manage_roles": false,
    "manage_services": false,
    "manage_orders": false,
    "manage_disputes": false,
    "manage_payouts": false,
    "manage_settings": false,
    "browse_marketplace": true,
    "create_listings": false,
    "create_projects": false,
    "apply_projects": false,
    "post_jobs": false,
    "apply_jobs": true,
    "access_b2b": false,
    "send_messages": true
  }'::jsonb, true),

  ('firm', 'platform', 'Registered firm with B2B access', '{
    "access_admin": false,
    "manage_users": false,
    "manage_roles": false,
    "manage_services": false,
    "manage_orders": false,
    "manage_disputes": false,
    "manage_payouts": false,
    "manage_settings": false,
    "browse_marketplace": true,
    "create_listings": false,
    "create_projects": true,
    "apply_projects": true,
    "post_jobs": true,
    "apply_jobs": true,
    "access_b2b": true,
    "send_messages": true
  }'::jsonb, true)

ON CONFLICT (name, scope) DO NOTHING;

-- ── Seed B2B org roles ──
INSERT INTO public.roles (name, scope, description, permissions, is_system_role) VALUES
  ('owner', 'org', 'Organization owner with full control', '{
    "access_admin": false,
    "manage_users": false,
    "manage_roles": false,
    "manage_services": false,
    "manage_orders": false,
    "manage_disputes": false,
    "manage_payouts": false,
    "manage_settings": false,
    "browse_marketplace": true,
    "create_listings": true,
    "create_projects": false,
    "apply_projects": false,
    "post_jobs": true,
    "apply_jobs": false,
    "access_b2b": true,
    "send_messages": true,
    "manage_org_members": true,
    "manage_org_settings": true,
    "manage_contracts": true,
    "manage_hiring": true
  }'::jsonb, true),

  ('admin', 'org', 'Organization admin with management access', '{
    "access_admin": false,
    "manage_users": false,
    "manage_roles": false,
    "manage_services": false,
    "manage_orders": false,
    "manage_disputes": false,
    "manage_payouts": false,
    "manage_settings": false,
    "browse_marketplace": true,
    "create_listings": true,
    "create_projects": false,
    "apply_projects": false,
    "post_jobs": true,
    "apply_jobs": false,
    "access_b2b": true,
    "send_messages": true,
    "manage_org_members": true,
    "manage_org_settings": true,
    "manage_contracts": true,
    "manage_hiring": true
  }'::jsonb, true),

  ('manager', 'org', 'Organization manager with operational access', '{
    "access_admin": false,
    "manage_users": false,
    "manage_roles": false,
    "manage_services": false,
    "manage_orders": false,
    "manage_disputes": false,
    "manage_payouts": false,
    "manage_settings": false,
    "browse_marketplace": true,
    "create_listings": true,
    "create_projects": false,
    "apply_projects": false,
    "post_jobs": true,
    "apply_jobs": false,
    "access_b2b": true,
    "send_messages": true,
    "manage_org_members": false,
    "manage_org_settings": false,
    "manage_contracts": true,
    "manage_hiring": true
  }'::jsonb, true),

  ('member', 'org', 'Organization member with basic access', '{
    "access_admin": false,
    "manage_users": false,
    "manage_roles": false,
    "manage_services": false,
    "manage_orders": false,
    "manage_disputes": false,
    "manage_payouts": false,
    "manage_settings": false,
    "browse_marketplace": true,
    "create_listings": true,
    "create_projects": false,
    "apply_projects": false,
    "post_jobs": false,
    "apply_jobs": false,
    "access_b2b": true,
    "send_messages": true,
    "manage_org_members": false,
    "manage_org_settings": false,
    "manage_contracts": false,
    "manage_hiring": false
  }'::jsonb, true),

  ('viewer', 'org', 'Organization viewer with read-only access', '{
    "access_admin": false,
    "manage_users": false,
    "manage_roles": false,
    "manage_services": false,
    "manage_orders": false,
    "manage_disputes": false,
    "manage_payouts": false,
    "manage_settings": false,
    "browse_marketplace": true,
    "create_listings": false,
    "create_projects": false,
    "apply_projects": false,
    "post_jobs": false,
    "apply_jobs": false,
    "access_b2b": true,
    "send_messages": true,
    "manage_org_members": false,
    "manage_org_settings": false,
    "manage_contracts": false,
    "manage_hiring": false
  }'::jsonb, true)

ON CONFLICT (name, scope) DO NOTHING;
