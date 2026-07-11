# Prompt: Create Organizations Database Migration

> **Target:** New migration file in `supabase/migrations/`
> **When to use:** Start of Sprint 1
> **Agent role:** Database Engineer

---

## Prompt

```
TASK: Create a Supabase migration file for the B2B organizations system.

EXPECTED OUTCOME: A single SQL migration file at `supabase/migrations/XXXXXX_b2b_organizations.sql` that creates all B2B tables and RLS policies.

REQUIRED TOOLS: Write (new migration file), Read (existing migration files for pattern matching)

MUST DO:
1. Create the migration file following existing naming convention: `20260709000002_b2b_organizations.sql`
2. Include ALL tables defined in `achieve/plans/01-b2b-architecture-plan.md` section 2.2:
   - organizations
   - org_members
   - org_invites
   - org_contracts
   - subscription_plans
   - org_invoices
3. Add columns to existing tables:
   - jobs.org_id (FK to organizations)
   - marketplace_listings.org_id (FK to organizations)
   - orders.org_id (FK to organizations)
4. Create proper indexes on all FK columns and commonly filtered columns
5. Create updated_at triggers for all new tables
6. Enable RLS on ALL new tables
7. Create RLS policies:
   - organizations: members can read their org, owner/admin can update
   - org_members: members can read, owner/admin can insert/update/delete
   - org_invites: member can see invites for their org
   - org_contracts: members can read contracts belonging to their org
   - org_invoices: same as contracts
   - subscription_plans: any authenticated user can read
8. Seed subscription_plans with 4 tiers:
   - free: $0, 1 member, 3 active jobs, basic talent search
   - starter: $49/mo $499/yr, 5 members, 15 jobs, advanced search
   - professional: $149/mo $1499/yr, 25 members, unlimited jobs, AI search, analytics, contracts
   - enterprise: custom pricing, unlimited, everything + white-label + API + compliance
9. Create function `public.handle_new_firm_signup()` that auto-creates an organization when a profile with role='firm' is created
10. Check existing profile constraint: Profiles already have roles including 'firm'

MUST NOT DO:
- Don't modify existing tables beyond adding FK columns
- Don't drop or replace existing RLS policies
- Don't use `as any` or TypeScript — this is pure SQL
- Don't remove or alter existing triggers

CONTEXT:
- Existing migration files are in `supabase/migrations/` — read 2-3 for naming/format patterns
- Existing RLS uses `auth.uid()` for user identification
- Existing profile roles: super_admin, admin, provider, buyer, moderator, student, firm
- Follow the same migration style as `20260715000000_admin_enhancements.sql`
```

---

## Verification Checklist
- [ ] Migration file follows naming convention
- [ ] All tables created with proper constraints
- [ ] RLS policies prevent cross-org data leaks
- [ ] Indexes on all FK columns
- [ ] Seeds run successfully (subscription_plans data)
- [ ] Auto-create function works for new firm signups
- [ ] Existing data unaffected
