# B2B/B2A Premium Business Dashboard — Architecture & Feature Plan

> **Date:** 2026-07-09
> **Author:** Sisyphus (Product Engineer & Architect)
> **Status:** Draft — awaiting research completion
> **Related:** `findings/01-current-state-analysis.md`

---

## 1. Executive Summary

Transform SkillBridge Africa from a student/talent-only marketplace into a **premium B2B/B2A platform** where firms, enterprises, NGOs, and government organizations hire, manage, and pay for African tech talent at scale.

**Core Pillars:**
1. **B2B Talent Solutions** — Bulk hiring, team management, talent pool access
2. **B2A Compliance & Verification** — Audit trails, compliance docs, government-ready reporting
3. **Enterprise Contracts & Payments** — MSAs, SOWs, milestone-based billing
4. **Premium Analytics** — Hiring ROI, spend tracking, talent pipeline analytics

---

## 2. Architecture

### 2.1 Module Structure (`Skillbridge/src/b2b/`)

```
src/b2b/
├── components/              # B2B-specific components
│   ├── layout/
│   │   └── B2BLayout.tsx    # Dashboard shell with org sidebar
│   ├── team/
│   │   ├── TeamList.tsx
│   │   ├── InviteMember.tsx
│   │   └── MemberRoles.tsx
│   ├── talent/
│   │   ├── TalentSearch.tsx  # Premium talent pool search
│   │   ├── SavedSearches.tsx
│   │   └── TalentList.tsx
│   ├── hiring/
│   │   ├── BulkJobPost.tsx
│   │   ├── PipelineView.tsx  # Kanban hiring pipeline
│   │   └── InterviewScheduler.tsx
│   ├── contracts/
│   │   ├── ContractList.tsx
│   │   ├── ContractViewer.tsx
│   │   └── MilestoneTracker.tsx
│   ├── analytics/
│   │   ├── HiringMetrics.tsx
│   │   ├── SpendReport.tsx
│   │   └── TalentROI.tsx
│   ├── compliance/
│   │   ├── VerificationBadge.tsx
│   │   ├── ComplianceReport.tsx
│   │   └── AuditLog.tsx
│   └── settings/
│       ├── OrgProfile.tsx
│       ├── Billing.tsx
│       ├── WhiteLabel.tsx
│       └── Subscription.tsx
├── pages/
│   ├── B2BDashboard.tsx      # Main org dashboard
│   ├── B2BTeam.tsx           # Team management
│   ├── B2BTalentPool.tsx     # Premium talent search
│   ├── B2BHiring.tsx         # Bulk hiring pipeline
│   ├── B2BContracts.tsx      # Contract management
│   ├── B2BAnalytics.tsx      # Analytics & reports
│   ├── B2BCompliance.tsx     # B2A compliance
│   └── B2BSettings.tsx       # Org settings
├── hooks/
│   ├── useOrg.ts             # Current org state
│   ├── useOrgMembers.ts      # Team members
│   ├── useSubscription.ts    # Premium tier status
│   └── useB2BTalent.ts       # Talent pool queries
├── lib/
│   ├── api.ts                # B2B API client
│   └── b2b-types.ts          # TypeScript types
└── index.ts                  # Module exports
```

### 2.2 Database Schema Additions

```sql
-- NEW: Organizations table (top-level entity)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  size TEXT CHECK (size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  tax_id TEXT,
  verification_status TEXT DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- NEW: Organization members (multi-user org accounts)
CREATE TABLE public.org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_id, profile_id)
);

-- NEW: Org invites (pending invitations)
CREATE TABLE public.org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'viewer')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NEW: Enterprise contracts (MSAs/SOWs)
CREATE TABLE public.org_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  talent_id UUID REFERENCES public.profiles(id),
  type TEXT NOT NULL CHECK (type IN ('msa', 'sow', 'fixed', 'milestone')),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'active', 'completed', 'cancelled')),
  signed_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  terms JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- NEW: Subscription plans & billing
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL,
  price_yearly NUMERIC NOT NULL,
  features JSONB NOT NULL DEFAULT '{}',
  max_team_members INT DEFAULT 1,
  max_active_jobs INT DEFAULT 1,
  talent_pool_access BOOLEAN DEFAULT false,
  analytics_access BOOLEAN DEFAULT false,
  white_label BOOLEAN DEFAULT false,
  compliance_reports BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NEW: Billing invoices
CREATE TABLE public.org_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id),
  plan_id UUID REFERENCES public.subscription_plans(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- EXISTING EXTENSIONS:
-- Add org_id to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
-- Add org_id to marketplace_listings (for enterprise bulk)
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
-- Add org_id to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
```

### 2.3 B2B Edge Function Endpoints

New edge function or extended endpoints in existing admin-api:

```
POST   /b2b/org                     → Create organization
GET    /b2b/org                     → Get current org
PATCH  /b2b/org                     → Update org profile
GET    /b2b/org/members             → List team members
POST   /b2b/org/members/invite      → Invite team member
DELETE /b2b/org/members/:id         → Remove member
PATCH  /b2b/org/members/:id/role    → Change member role

GET    /b2b/talent/search           → Premium talent search (with AI matching)
GET    /b2b/talent/saved            → Saved talent lists
POST   /b2b/talent/saved            → Save talent to list

POST   /b2b/jobs/bulk               → Bulk job posting
GET    /b2b/hiring/pipeline         → Hiring pipeline (Kanban)

GET    /b2b/contracts               → List contracts
POST   /b2b/contracts               → Create contract
PATCH  /b2b/contracts/:id           → Update contract

GET    /b2b/analytics/hiring        → Hiring funnel analytics
GET    /b2b/analytics/spend         → Spend & ROI analytics
GET    /b2b/analytics/talent        → Talent pool analytics

GET    /b2b/compliance/report       → Generate compliance report

PATCH  /b2b/settings/billing        → Update billing info
PATCH  /b2b/settings/whitelabel     → Update white-label settings

GET    /b2b/subscription            → Get current subscription
POST   /b2b/subscription/change     → Upgrade/downgrade plan
```

---

## 3. Premium Subscription Tiers

| Feature | Free | Starter | Professional | Enterprise |
|---------|------|---------|-------------|------------|
| **Price (monthly)** | $0 | $49 | $149 | Custom |
| **Team Members** | 1 | 5 | 25 | Unlimited |
| **Active Jobs** | 3 | 15 | Unlimited | Unlimited |
| **Talent Pool Search** | Basic | Advanced | AI-Powered | API Access |
| **Bulk Hiring** | — | ✓ | ✓ | ✓ |
| **Hiring Pipeline** | — | Basic | Kanban | Custom |
| **Analytics** | — | Basic | Advanced | Custom Reports |
| **Contracts** | — | 5/mo | Unlimited | Unlimited |
| **Compliance (B2A)** | — | — | Reports | Audit Trail |
| **White-label** | — | — | — | ✓ |
| **Transaction Fee** | 10% | 7% | 5% | Negotiable |
| **API Access** | — | — | ✓ | ✓ |
| **Priority Support** | — | Email | Chat | Dedicated |

---

## 4. B2A Compliance Features

For government and administration clients:
- **Org verification** — Tax ID, business registration, KYC documentation
- **Compliance reports** — Generated hiring reports for govt auditing
- **Audit trail** — Every action logged (admin_audit_log extension)
- **Talent verification** — Verified skills badges, background check integration
- **Local content compliance** — Reports showing percentage of local hires
- **Data residency** — Ensure data stays in-country (African data sovereignty)

---

## 5. Implementation Phases

### Phase 1: Foundation (MVP)
- Organizations table + migration
- Multi-user org member system (invite/join)
- B2B layout shell with sidebar navigation
- Basic org dashboard (upgraded from OrgDashboard)
- Premium subscription gating (feature flags)
- **Duration: 2 sprints**

### Phase 2: B2B Core Features
- Premium talent pool search with AI matching
- Bulk job posting
- Hiring pipeline (Kanban board)
- Team management UI
- Extended contract management
- **Duration: 3 sprints**

### Phase 3: Analytics & B2A
- Hiring analytics dashboard
- Spend & ROI reporting
- Compliance report generation
- Org verification system
- White-label settings
- **Duration: 2 sprints**

### Phase 4: Enterprise Scale
- API access for enterprise integration
- Custom onboarding flows
- Dedicated account management UI
- Advanced white-label (custom domain, full branding)
- B2A government portal features
- **Duration: 2 sprints**
