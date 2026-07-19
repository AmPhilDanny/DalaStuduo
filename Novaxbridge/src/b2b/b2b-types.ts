// ============================================================
// B2B/B2A Organization Platform — TypeScript Interfaces
// ============================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_members: number;
  max_active_jobs: number;
  features: Record<string, boolean>;
  is_active: boolean;
  sort_order: number;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  size: '1-10' | '11-50' | '51-200' | '201-500' | '500+' | null;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  subscription_plan_id: string | null;
  subscription_starts_at: string | null;
  subscription_ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrgMemberRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgMemberRole;
  title: string | null;
  joined_at: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email?: string;
    role?: string;
  } | null;
}

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface OrgInvite {
  id: string;
  org_id: string;
  email: string;
  token: string;
  role: Exclude<OrgMemberRole, 'owner'>;
  invited_by: string;
  status: InviteStatus;
  message: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  inviter?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface SubscriptionStatus {
  plan: SubscriptionPlan | null;
  status: 'active' | 'expired' | 'none';
  starts_at: string | null;
  ends_at: string | null;
}

export interface UserOrgInfo {
  org: Organization;
  role: OrgMemberRole;
}

export interface B2BApiError {
  error: string;
}
