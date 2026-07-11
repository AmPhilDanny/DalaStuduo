# Prompt: Create B2B Edge Function

> **Target:** `supabase/functions/b2b-api/index.ts`
> **When to use:** Sprint 1 — after organizations migration is deployed
> **Agent role:** Backend Engineer

---

## Prompt

```
TASK: Create a Supabase Edge Function for B2B API operations.

EXPECTED OUTCOME: A complete edge function at `supabase/functions/b2b-api/index.ts` handling all org, member, subscription, and basic B2B operations.

REQUIRED TOOLS: Read (existing edge functions for pattern reference), Write (new function file)

MUST DO:
1. Follow the exact same pattern as `supabase/functions/admin-api/index.ts`:
   - Deno.serve handler
   - CORS headers
   - URL path routing
   - Auth via Bearer token → getUser()
   - Service-role client for DB operations
   - Audit logging pattern
2. Implement these endpoints with auth middleware checking org membership:

   POST /b2b/org — Create organization
   - Body: { name, slug, industry?, size?, website? }
   - Auto-set creator as owner member
   - Assign free subscription tier
   - Response: { data: organization }

   GET /b2b/org — Get current user's active org
   - Query param: org_id (or use default from user's memberships)
   - Response: { data: organization, members: [], subscription: {} }

   PATCH /b2b/org — Update org profile
   - Body: { name?, logo_url?, website?, industry?, size?, settings? }
   - Require owner or admin role
   - Response: { data: organization }

   GET /b2b/org/members — List members
   - Response: { data: [{ profile, role, joined_at }] }

   POST /b2b/org/members/invite — Invite member
   - Body: { email, role (admin|manager|viewer) }
   - Generate unique token, set expiry (7 days)
   - Create org_invites record
   - Response: { data: invite }

   DELETE /b2b/org/members/:id — Remove member
   - Cannot remove owner
   - Must leave at least one owner

   PATCH /b2b/org/members/:id/role — Change role
   - Body: { role }
   - Cannot change owner role

   GET /b2b/membership — Get all orgs current user belongs to
   - Response: { data: [{ org, role }] }

   GET /b2b/subscription — Get current subscription
   - Response: { data: { plan, status, expires_at, features } }

   POST /b2b/subscription/change — Change subscription
   - Body: { plan_slug, billing_period (monthly|yearly) }
   - Check if downgrade: warn about feature limits
   - Response: { data: subscription }

3. Role hierarchy enforcement:
   - owner: full access
   - admin: manage members, update org, all content
   - manager: manage jobs, contracts, talent lists
   - viewer: read-only access

4. Audit logging via admin_audit_log table (reuse existing)

5. Service-role client for all DB operations (SB_SERVICE_KEY pattern)

MUST NOT DO:
- Don't expose auth tokens or secrets
- Don't allow RLS bypass without service-role client
- Don't allow deleting the last owner of an org
- Don't allow cross-org data access
- Don't add new npm dependencies

CONTEXT:
- Read `supabase/functions/admin-api/index.ts` for exact pattern reference
- Read `supabase/functions/messaging/index.ts` for service-role client pattern
- The admin_audit_log table exists with: admin_id, action, entity_type, entity_id, details
- All endpoints use the existing supabase client pattern with Authorization header
```

---

## Verification Checklist
- [ ] All endpoints return proper HTTP status codes
- [ ] Auth middleware rejects unauthenticated requests
- [ ] Role enforcement blocks unauthorized actions
- [ ] Edge function deploys without errors
- [ ] Invite flow creates token and stores in DB
- [ ] Subscription change validates plan transition
- [ ] Audit log entries created for mutations
- [ ] CORS headers match existing functions
