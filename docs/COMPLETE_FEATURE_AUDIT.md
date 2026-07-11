# Gebeya Dala — Complete Feature Audit & Sprint Roadmap

## Database Schema (supabase/migrations/)

| Migration | Tables Created |
|---|---|
| `20250620000000_init_marketplace.sql` | profiles, jobs, applications |
| `20250620000001_fix_security_advisories.sql` | — (fixes) |
| `20250620000002_optimize_rls_performance.sql` | — (indexes/optimizations) |
| `20260703000000_talent_platform.sql` | projects, project_roles, portfolio_items, project_applications, project_members, connections |
| `20260708000000_ai_tutor.sql` | tutor_sessions, tutor_messages, knowledge_base, tutor_assessments |
| `20260708000000_chat_attachments.sql` | chat_attachments |
| `20260708000001_milestones.sql` | order_milestones |
| `20260708054725_payment_messaging.sql` | messages, marketplace_listings, orders, wallet_transactions, payouts, notifications, site_settings, services, disputes (later), admin_audit_log (later) |
| `20260709000000_admin_dashboard.sql` | disputes, admin_audit_log, profiles role extended to include 'admin' |

## Edge Functions

| Function | Endpoints |
|---|---|
| **admin-api** | GET /admin/users, PATCH /admin/users/:id/role, GET /admin/disputes, PATCH /admin/disputes/:id, GET /admin/payouts, GET /admin/stats, GET /admin/settings, PATCH /admin/settings, GET /admin/audit-log |
| **ai-assist** | AI tutor endpoints |
| **marketplace-listings** | CRUD for marketplace listings |
| **marketplace-orders** | Order lifecycle (create, update status, milestones) |
| **marketplace-payments** | Escrow release, payment gateway config, currency handling (stub — no real Paystack/Flutterwave) |
| **marketplace-reviews** | Review submission and aggregation |
| **messaging** | Messages CRUD, file upload, realtime push |
| **notifications** | List, unread count, mark read |
| **wallet-payouts** | Balance calc, transactions list, payout request, admin approve/reject |

## Frontend Pages (src/pages/)

| Page | Route | Status |
|---|---|---|
| Home | `/` | ✅ |
| Auth (login/signup) | `/auth` | ✅ |
| Jobs | `/jobs` | ✅ |
| PostJob | `/jobs/new` | ✅ |
| Talent | `/talent` | ✅ |
| Profile | `/profile`, `/talent/:id` | ✅ |
| Projects | `/projects` | ✅ |
| ProjectDetail | `/projects/:id` | ✅ |
| MyApplications | `/my-applications` | ✅ |
| Tutor | `/tutor` | ✅ |
| TutorChat | `/tutor/:id` | ✅ |
| UserDashboard | `/dashboard` | ✅ |
| OrgDashboard | `/dashboard/org` | ✅ |
| Marketplace | `/marketplace` | ✅ |
| MarketplaceDetail | `/marketplace/:id` | ✅ |
| CreateListing | `/marketplace/new` | ✅ |
| MyOrders | `/orders` | ✅ |
| OrderDetail | `/orders/:id` | ✅ |
| Wallet | `/wallet` | ✅ |
| MyListings | `/my-listings` | ✅ |
| Messages | `/messages` | ✅ |
| AdminDashboard | `/admin` | ✅ |

## Frontend Components (src/components/)

| Directory | Contents | Status |
|---|---|---|
| `home/` | Hero, Stats, Mission, Programs, Mentorship, Testimonials, EnrollmentForm | ✅ |
| `layout/` | Navbar (with notifications), Footer | ✅ |
| `ui/` | shadcn/ui components | ✅ |
| `messaging/` | ChatBox (with file attachments), ChatList | ✅ |
| `ai/` | AI tutor components | ✅ |
| `talent/` | Talent-related components | ✅ |

## Implemented Features ✅

1. **Authentication** — email/password, profile creation on signup, role-based (student/firm/admin)
2. **Jobs** — firms post, students apply, status workflow (pending→reviewed→accepted/rejected)
3. **Talent/Projects** — project listings, applications, portfolio, mentorship connections
4. **Marketplace** — service listings, browse, search, create
5. **Orders** — lifecycle (pending→in_progress→completed/disputed/cancelled/refunded)
6. **Order Milestones** — provider creates milestones, buyer approves/rejects, progress bar
7. **Messaging** — realtime chat with file/image attachments
8. **Wallet** — balance tracking, transaction history, payout requests
9. **Payouts** — request (user), approve/reject (admin)
10. **Notifications** — in-app bell, mark read, mark all read, polling
11. **Admin Dashboard** — stats, users CRUD, disputes, payouts, settings, audit log
12. **Disputes** — raise dispute on order, admin resolve/dismiss
13. **AI Tutor** — tutor chat sessions
14. **Home Page** — landing with programs, mission, testimonials, enrollment
15. **Navbar** — responsive with notifications dropdown, role-based links

---

# Sprint Roadmap — Remaining Work

## Sprint 10: Escrow & Payments Integration 🏆 (HIGHEST IMPACT)

**Why**: Revenue engine. Without real payment processing, the marketplace can't transact.

**Tasks**:
- Implement Paystack transaction split endpoint in `marketplace-payments` edge function
- Implement Flutterwave split payment as alternative
- Escrow hold on order creation → release on milestone approval / order completion
- Service fee auto-deduction at settlement
- Frontend: Payment checkout modal on order creation
- Frontend: "Pay Now" button on OrderDetail
- Frontend: Escrow release status indicator
- Currency detection from user profile / IP geolocation

**DB**: Already has `payment_intent_id`, `escrow_release_at`, `service_fee_amount`, `provider_payout` columns. Ready.

---

## Sprint 11: Reviews & Ratings System

**Why**: Trust signal. Buyers need to see provider reputation before hiring.

**Tasks**:
- Reviews edge function — submit, aggregate ratings
- Provider rating calculation (avg, count, breakdown by category)
- Review display on provider profile / listing detail
- Review prompt after order completion
- "Report review" flow for moderation
- Top-rated providers badge

**DB**: `orders` already has `rating` and `review` columns.

---

## Sprint 12: User Onboarding Flow 🧭

**Why**: Current signup drops users in. Guided setup improves retention.

**Tasks**:
- Onboarding wizard after first signup (3-step: profile, skills, preferences)
- Profile completion checklist in dashboard
- "First listing" prompt for providers
- "First order" guidance for buyers
- Tooltips and empty-state guides on dashboard pages
- Suggested connections / talent discovery

---

## Sprint 13: Video/Voice Calls 📹

**Why**: Real-time communication between buyers and providers.

**Tasks**:
- Install `@jitsi/react-sdk`
- Build `<VideoCallRoom />` component
- Add "Video Call" button in Messages / OrderDetail
- Generate unique room names per order
- Jitsi config (P2P mode for 1-on-1, conference mode auto)
- Show call history / call log
- *Deferred: JaaS upgrade if scaling needed*

**Reference**: `docs/VIDEO_CALL_REFERENCE.md`

---

## Sprint 14: PWA & Offline Support 📱

**Why**: Many African users access via mobile. Offline support matters.

**Tasks**:
- Register service worker with `vite-plugin-pwa`
- Cache key pages (marketplace listings, orders, wallet)
- Offline fallback page
- Push notification setup (Subabase Realtime + browser push API)
- Manifest icons and splash screens
- Install prompt ("Add to Home Screen")

---

## Sprint 15: SEO & Public Pages 🌐

**Why**: Discovery via search engines.

**Tasks**:
- About page (`/about`)
- FAQ page (`/faq`)
- Contact page (`/contact`) with inquiry form
- Terms of Service (`/terms`)
- Privacy Policy (`/privacy`)
- Dynamic meta tags per listing/order
- Sitemap generation
- Structured data (JSON-LD) for listings

---

## Sprint 16: Email Notifications 📧

**Why**: In-app notifications alone miss users who are away.

**Tasks**:
- Supabase Database function → Edge function → email service
- Resend / SendGrid integration on Supabase
- Email on: new message, order status change, payout processed, dispute update
- Email preference settings per user
- Email templates in HTML

---

## Future / Deferred

- **Multi-language support** (French, Portuguese, Swahili, Arabic for Pan-African reach)
- **Analytics dashboard** for providers (earnings charts, conversion data)
- **Mobile app** (React Native or Flutter)
- **AI matching** — auto-suggest providers to buyers based on order description
- **Subscription plans** for providers (featured listings, priority support)
- **Escrow auto-release** after 7 days of buyer inactivity
- **Identity verification** (KYC for high-value orders)