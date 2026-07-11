# Sprint 5: Launch Readiness

## Goal
Address gaps blocking public launch. Ship a production-ready platform.

---

## P0 — Testing Infrastructure (High effort)

| Task | Effort | Description |
|------|--------|-------------|
| 5.1 | Set up Vitest | Install, configure, write first test for auth flow |
| 5.2 | Payment flow tests | `/payment/initialize` → verify → release/milestone |
| 5.3 | B2B contract lifecycle | Create → approve → activate → complete → settle |
| 5.4 | Messaging tests | Send, receive, conversation listing |
| 5.5 | E2E smoke test (Playwright) | Login → browse → order → pay → review |

## P0 — Email Notifications

| Task | Effort | Description |
|------|--------|-------------|
| 5.6 | Create `send-email` edge function | Resend or SendGrid integration |
| 5.7 | Trigger on key events | New message, order placed, payment received, contract status change |
| 5.8 | Email templates | Build responsive HTML templates |

## P0 — SEO & Public Pages

| Task | Effort | Description |
|------|--------|-------------|
| 5.9 | Public pages | `/about`, `/faq`, `/contact`, `/terms`, `/privacy` |
| 5.10 | Meta tag hook | Dynamic `<title>`, `<meta>`, OG tags per route |
| 5.11 | Sitemap + robots.txt | Static sitemap generation |
| 5.12 | JSON-LD structured data | Organization + WebApplication schema |

## P1 — Onboarding Flow

| Task | Effort | Description |
|------|--------|-------------|
| 5.13 | Welcome wizard | Role selection → profile completion → first action |
| 5.14 | Empty states | Add guides on empty dashboards, listings, orders |
| 5.15 | Tour component | Simple step-through guide for key features |

## P1 — PWA

| Task | Effort | Description |
|------|--------|-------------|
| 5.16 | Install vite-plugin-pwa | Service worker, manifest, icons |
| 5.17 | Offline fallback | Basic offline page + cache strategy |

## P1 — Supabase Type Safety

| Task | Effort | Description |
|------|--------|-------------|
| 5.18 | Generate database types | `supabase gen types typescript > types/supabase.ts` |
| 5.19 | Replace `as any` casts | Across all query files |

## P2 — Admin Dashboard Navigation

| Task | Effort | Description |
|------|--------|-------------|
| 5.20 | Add sidebar nav | Tab layout: Users, Services, Disputes, Payouts, Bank Accounts, Audit Log, Settings |

## P3 — Code Splitting

| Task | Effort | Description |
|------|--------|-------------|
| 5.21 | Dynamic imports | Split admin panel, B2B module, payment flow |

## P3 — Site Settings 406 Error

| Task | Effort | Description |
|------|--------|-------------|
| 5.22 | Debug 406 | Check `site_settings` table + RLS |

---

## Dependencies
- Docker Desktop on this machine or Supabase CLI for local testing
- Resend/SendGrid API key for email
- Playwright installed for E2E tests

## Not In Scope (Backlog)
- Mobile app (React Native)
- Multi-language support
- Analytics dashboard (Mixpanel/PostHog)
- Notification preferences page
- Password reset flow (relies on Supabase default)
