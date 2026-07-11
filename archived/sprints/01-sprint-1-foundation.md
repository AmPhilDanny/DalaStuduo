# Sprint 1: B2B Foundation & Org System

> **Duration:** 2 weeks
> **Goal:** Multi-user org accounts, subscription gating, B2B layout shell
> **Dependencies:** None (new tables, no migration conflicts)

---

## Sprint Backlog

### Story 1.1: Organizations Table & Migration
**Estimate:** 2 days  
**Priority:** P0 — Blocks everything

**Tasks:**
- [ ] Create `organizations` table migration (`supabase/migrations/XXXXXX_b2b_organizations.sql`)
- [ ] Create `org_members` table with role constraints
- [ ] Create `org_invites` table for email invitations
- [ ] Create `subscription_plans` table with seed data (free/starter/professional/enterprise)
- [ ] Add `org_id` FK to existing `jobs`, `marketplace_listings`, `orders`
- [ ] Add RLS policies for org-scoped access
- [ ] Auto-create org when firm account registers (trigger or post-signup hook)
- [ ] Add update_updated_at trigger

**Acceptance:**
- SQL migrations run cleanly against current DB
- RLS prevents cross-org data access
- New firm signups auto-create an org
- Rollback script works

### Story 1.2: B2B Edge Function
**Estimate:** 3 days  
**Priority:** P0

**Tasks:**
- [ ] Create `supabase/functions/b2b-api/index.ts` (or extend admin-api with `/b2b/*` routes)
- [ ] Implement: POST /b2b/org (create), GET /b2b/org (read), PATCH /b2b/org (update)
- [ ] Implement: GET /b2b/org/members, POST /b2b/org/members/invite, DELETE /b2b/org/members/:id
- [ ] Implement: GET /b2b/subscription, POST /b2b/subscription/change
- [ ] Auth: verify user is member of org, check role permissions
- [ ] Audit logging for all org mutations
- [ ] CORS headers matching existing edge functions

**Acceptance:**
- Org CRUD works with proper auth
- Invite sends email with magic link (or token-based)
- Role-based access enforced (owner=all, admin=most, manager=members+content, viewer=read)
- Subscription endpoints return current plan info

### Story 1.3: B2B Frontend Module Structure
**Estimate:** 2 days  
**Priority:** P0

**Tasks:**
- [ ] Create `src/b2b/` directory structure
- [ ] Create `src/b2b/b2b-types.ts` — TypeScript interfaces for org, member, invite, subscription
- [ ] Create `src/b2b/lib/api.ts` — API client wrapping b2b-api edge function
- [ ] Create `src/b2b/hooks/useOrg.ts` — Org state provider/context
- [ ] Create `src/b2b/hooks/useOrgMembers.ts` — Team members hook
- [ ] Create `src/b2b/hooks/useSubscription.ts` — Subscription state hook
- [ ] Create route guard `useRequireOrg()` — redirect if no org or wrong role

**Acceptance:**
- All B2B API calls go through typed functions
- Hooks handle loading/error states
- Route guard prevents non-org access

### Story 1.4: B2B Layout Shell
**Estimate:** 2 days  
**Priority:** P0

**Tasks:**
- [ ] Create `src/b2b/components/layout/B2BLayout.tsx` — App shell with org sidebar
- [ ] Org sidebar with navigation: Dashboard, Team, Talent, Hiring, Contracts, Analytics, Settings
- [ ] Org switcher if member of multiple orgs
- [ ] Subscription badge showing current plan
- [ ] Responsive (sidebar collapses on mobile)
- [ ] Match existing app header/footer patterns

**Acceptance:**
- Layout renders at `/b2b/*` routes
- Navigation highlights active section
- Subscription badge visible in sidebar
- Mobile-responsive

### Story 1.5: B2B Org Dashboard Page
**Estimate:** 3 days  
**Priority:** P0

**Tasks:**
- [ ] Create `src/b2b/pages/B2BDashboard.tsx` — Premium org dashboard
- [ ] Stats cards: active jobs, team members, talent pool matches, pending applications
- [ ] Recent activity feed (contract actions, new members, application statuses)
- [ ] Subscription upgrade prompt for free-tier users
- [ ] Quick actions: post job, invite member, search talent
- [ ] AI-powered insight section (using `ai-assist` admin mode)
- [ ] Wire to existing OrgDashboard route or replace `/dashboard/org`

**Acceptance:**
- Dashboard loads quickly with cached user data
- Stats are real-time from DB
- Upgrade prompt only shows for free tier
- AI insights load asynchronously

### Story 1.6: Org Setup/Onboarding Flow
**Estimate:** 3 days  
**Priority:** P1

**Tasks:**
- [ ] Create org setup wizard (multi-step): company name, industry, size, logo
- [ ] Redirect new firm signups to setup flow
- [ ] Free plan auto-activated on setup completion
- [ ] Invite team members option during setup

**Acceptance:**
- First-time firm users see setup wizard
- Org is created with sensible defaults
- Users can skip and configure later

### Story 1.7: Migration & Seed Data
**Estimate:** 1 day  
**Priority:** P1

**Tasks:**
- [ ] Write migration to create subscription_plans seed data
- [ ] Backfill existing firm profiles: auto-create orgs
- [ ] Data integrity checks

**Acceptance:**
- All existing firm profiles have an org
- Subscription plans seeded correctly

---

## Definition of Done (per story)
- ✅ Code reviewed
- ✅ LSP diagnostics clean
- ✅ RLS policies tested (insert/select/update as different roles)
- ✅ Edge function tested with sample requests
- ✅ UI renders without errors
- ✅ Responsive design verified

## Risks & Mitigations
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| RLS conflicts with existing policies | Medium | Test org-scoped RLS against existing firm data |
| Complex invite flow | Medium | Start with simple token-based invite, enhance later |
| Migration conflicts | Low | Run against staging DB first |
