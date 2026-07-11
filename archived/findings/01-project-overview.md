# Project Overview: SkillBridge Africa

## Repository Structure

```
dala/
  archived/              # New — findings, plans, sprints
  admin/                 # Separate admin dashboard app (Vite + React)
    dist/                # Built admin app
    src/                 # Admin source
      App.tsx            # Single route: / → AdminDashboard
    vite.config.ts       # Port 3001
    package.json         # skillbridge-admin

  Skillbridge/           # Main platform app
    supabase/
      functions/         # 11 edge functions (see findings/02)
        _shared/         # Shared constants
        admin-api/       # Admin REST endpoints
        ai-assist/       # AI tutor + assistance
        b2b-api/         # B2B organization platform
        marketplace-listings/
        marketplace-orders/
        marketplace-payments/
        marketplace-reviews/
        messaging/
        notifications/
        wallet-payouts/
      migrations/        # 29 SQL migration files
    src/
      App.tsx            # Main app routing (30+ routes)
      pages/             # 25 page components
      components/        # UI components organized by domain
      lib/               # API clients, utilities
      b2b/               # B2B org platform module
        lib/api.ts       # 40+ API client functions
        components/      # 15+ B2B components
        pages/           # 3 pages (Dashboard, OrgSetup, InviteAccept)
        hooks/           # useOrg, useOrgMembers, useRequireOrg, useSubscription
      integrations/supabase/  # Supabase client config
    package.json         # react-starter-template
```

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions via Deno)
- **Auth**: Supabase Auth
- **Payments**: Paystack + Flutterwave + Manual bank transfers + Escrow
- **Video**: Jitsi Meet (CustomVideoCall component)
- **AI**: AI Assist button + AI Tutor chat

## Deployed Apps

| App | URL | Status |
|-----|-----|--------|
| Main (Skillbridge) | http://localhost:3000 | Running (Vite dev) |
| Admin | http://localhost:3001 | Running (Vite dev) |
| Supabase | Remote only (no local Docker) | Blocked on this machine |

## Three Platforms in One

1. **Main Marketplace** — Listings, orders, payments, messaging, disputes, wallet, reviews, connections, projects, AI tutor
2. **B2B Organization Platform** — Orgs, team management, talent pool, hiring pipeline, contracts, compliance, billing, analytics, branding, video calls
3. **Admin Dashboard** — Users, services, disputes, payouts, manual payments, bank accounts, audit log, platform stats

## Database Migrations (29 total)

| Migration | Purpose |
|-----------|---------|
| 20250620000000_init_marketplace | Core marketplace tables |
| 20250620000001_fix_security_advisories | Security fixes |
| 20250620000002_optimize_rls_performance | RLS optimization |
| 20260703000000_talent_platform | Talent profiles |
| 20260708000000_ai_tutor | AI tutor tables |
| 20260708000001_milestones | Order milestones |
| 20260708000002_chat_attachments | File attachments |
| 20260708054725_payment_messaging | Payment + messaging |
| 20260709000000_admin_dashboard | Admin tables |
| 20260709000001_seed_data | Seed data |
| 20260710000000_payment_intents | Payment intents |
| 20260711000000_provider_availability | Provider calendar |
| 20260712000000_dispute_messages | Dispute messaging |
| 20260713000000_dispute_tables | Dispute system |
| 20260714000000_fix_order_milestones | Milestone fixes |
| 20260715000000_admin_enhancements | Admin enhancements |
| 20260716000000_manual_payments_bank_accounts | Manual payments |
| 20260717000000_connections_projects_enhancements | Connections + projects |
| 20260718000000_find_existing_conversation | Conversation lookup |
| 20260719000000_b2b_organizations | B2B orgs core |
| 20260720000000_b2b_talent | B2B talent management |
| 20260721000000_b2b_pipeline | B2B hiring pipeline |
| 20260722000000_b2b_contracts | B2B contracts |
| 20260723000000_b2b_compliance | B2B compliance |
| 20260724000000_b2b_billing | B2B billing/subscriptions |
| 20260725000000_b2b_branding | B2B org branding |
| 20260726000000_platform_config | Platform config |
| 20260727000000_call_rooms | Video call rooms |
| fix_rpc_updated_at | RPC fix |
