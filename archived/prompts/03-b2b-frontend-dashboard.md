# Prompt: Build B2B Dashboard Frontend

> **Target:** `src/b2b/pages/B2BDashboard.tsx` + layout
> **When to use:** Sprint 1 — after edge function is ready
> **Agent role:** Frontend Engineer

---

## Prompt

```
TASK: Build the B2B premium business dashboard frontend module.

EXPECTED OUTCOME: A complete B2B dashboard under `src/b2b/` with layout, pages, hooks, and API client — replacing the basic OrgDashboard with a premium experience.

REQUIRED TOOLS: Read (existing pages for pattern reference), Write/Edit (create new files in src/b2b/)

MUST DO:

1. Create `src/b2b/b2b-types.ts`:
   - Organization, OrgMember, OrgInvite interfaces
   - SubscriptionPlan, Subscription interfaces
   - B2BTalent, B2BContract, B2BHiringStage types
   - Feature flags map (what each tier unlocks)

2. Create `src/b2b/lib/api.ts`:
   - Typed fetch wrapper calling supabase functions
   - All API methods matching b2b-api edge function endpoints
   - Consistent error handling pattern

3. Create `src/b2b/hooks/useOrg.ts`:
   - React context provider for current org
   - Load org data on mount
   - Provide org, members, subscription to children
   - Loading/error states

4. Create `src/b2b/components/layout/B2BLayout.tsx`:
   - Sidebar navigation with sections: Dashboard, Team, Talent Pool, Hiring, Contracts, Analytics, Compliance, Settings
   - Subscription badge showing current plan name + color
   - Org name/logo in sidebar header
   - Collapsible on mobile (hamburger menu)
   - Active route highlighting

5. Create `src/b2b/pages/B2BDashboard.tsx`:
   - Welcome header with org name and subscription status
   - Stats grid (4 cards): Active Jobs, Team Members, Talent Pool Matches, Active Contracts
   - Stats use color indicators: green=good, amber=warning, red=attention
   - Recent activity feed (last 10 actions from audit log)
   - AI Insights card (calls ai-assist admin mode with org data)
   - Quick action buttons: Post Job, Search Talent, Invite Member
   - For free tier: show upgrade prompt banner

6. Create route setup — add to existing router in App.tsx:
   - /b2b/dashboard → B2BDashboard
   - /b2b/team → B2BTeam (placeholder)
   - /b2b/talent → B2BTalentPool (placeholder)
   - /b2b/hiring → B2BHiring (placeholder)
   - /b2b/contracts → B2BContracts (placeholder)
   - /b2b/analytics → B2BAnalytics (placeholder)
   - /b2b/settings → B2BSettings (placeholder)

7. Route guard: wrap all /b2b/* routes to check auth + org membership
   - Redirect to /auth if not logged in
   - Redirect to /auth if logged in but not a firm member

8. Match existing app design patterns:
   - Use shadcn components (already imported)
   - Use lucide-react icons
   - Dark mode compatible
   - Responsive (mobile-first)

MUST NOT DO:
- Don't add new npm dependencies
- Don't modify existing pages outside of adding routes
- Don't break the existing OrgDashboard — we'll retire it later
- Don't use `as any` type assertions
- Don't fetch data without loading/error states

CONTEXT:
- Read `src/pages/OrgDashboard.tsx` for the current firm dashboard pattern
- Read `src/pages/AdminDashboard.tsx` for the admin panel pattern
- Read `src/App.tsx` for route setup pattern
- Read `src/components/ui/` for available shadcn components
- The existing app uses Tailwind CSS with CSS variables for theming
- App header/footer are in `src/components/layout/`
```

---

## Verification Checklist
- [ ] Layout renders correctly at all screen sizes
- [ ] Routes are set up and navigable
- [ ] Org data loads from API on mount
- [ ] Subscription badge shows correctly
- [ ] Stats cards update with real data
- [ ] Upgrade prompt only shows for free tier
- [ ] No TypeScript errors
- [ ] Responsive on mobile
