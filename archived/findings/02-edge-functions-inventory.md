# Edge Functions Inventory

## 1. admin-api
**Path**: `supabase/functions/admin-api/index.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/health` | Health check |
| GET | `/admin/users` | List all users |
| PATCH | `/admin/users/:id/role` | Change user role |
| GET | `/admin/services` | List services |
| POST | `/admin/services` | Create service |
| PATCH | `/admin/services/:id` | Update service |
| DELETE | `/admin/services/:id` | Delete service |
| GET | `/admin/disputes` | List disputes |
| PATCH | `/admin/disputes/:id` | Update dispute status |
| GET | `/admin/payouts` | List payout requests |
| GET | `/admin/stats` | Platform statistics |
| GET | `/admin/settings` | Get platform settings |
| PATCH | `/admin/settings` | Update platform settings |
| GET | `/admin/manual-payments` | List manual payments |
| PATCH | `/admin/manual-payments/:id/approve` | Approve manual payment |
| PATCH | `/admin/manual-payments/:id/reject` | Reject manual payment |
| GET | `/admin/provider-bank-accounts` | List bank accounts |
| PATCH | `/admin/provider-bank-accounts/:id/verify` | Verify bank account |
| GET | `/admin/audit-log` | Get audit log |

## 2. ai-assist
**Path**: `supabase/functions/ai-assist/index.ts`
- AI-powered assistance endpoint
- Single POST handler

## 3. b2b-api
**Path**: `supabase/functions/b2b-api/index.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/b2b/health` | Health check |
| GET | `/b2b/org` | Get org info |
| POST | `/b2b/org` | Create org |
| PATCH | `/b2b/org` | Update org |
| GET | `/b2b/org/members` | List org members |
| POST | `/b2b/org/members/invite` | Invite member |
| POST | `/b2b/org/invites/accept` | Accept invite (by token) |
| GET | `/b2b/org/memberships` | List user's org memberships |
| POST | `/b2b/org/switch` | Switch active org |
| PATCH | `/b2b/org/members/:id/role` | Change member role |
| GET | `/b2b/org/invites` | List org invites |
| DELETE | `/b2b/org/invites/:id` | Cancel invite |
| DELETE | `/b2b/org/members/:id` | Remove member |
| GET | `/b2b/subscription` | Get subscription status |
| POST | `/b2b/subscription/change` | Change subscription |
| GET | `/b2b/talent/search` | Search talent pool |
| GET | `/b2b/talent/saved-searches` | List saved searches |
| POST | `/b2b/talent/saved-searches` | Save a search |
| DELETE | `/b2b/talent/saved-searches/:id` | Delete saved search |
| POST | `/b2b/jobs/bulk` | Bulk post jobs |
| GET | `/b2b/hiring/applications` | List pipeline applications |
| PATCH | `/b2b/hiring/pipeline/:id` | Update pipeline status |
| POST | `/b2b/hiring/pipeline/bulk` | Bulk update pipeline |
| GET | `/b2b/talent/lists` | List talent lists |
| POST | `/b2b/talent/lists` | Create talent list |
| DELETE | `/b2b/talent/lists/:id` | Delete talent list |
| GET | `/b2b/talent/lists/:id/talent` | Get talent in list |
| POST | `/b2b/talent/lists/:id/talent` | Add talent to list |
| DELETE | `/b2b/talent/lists/:id/talent/:tid` | Remove talent from list |
| GET | `/b2b/contracts` | List contracts |
| POST | `/b2b/contracts` | Create contract |
| GET | `/b2b/contracts/:id` | Get contract detail |
| PATCH | `/b2b/contracts/:id` | Update contract |
| POST | `/b2b/contracts/:id/status` | Transition contract status |
| POST | `/b2b/contracts/:id/settle` | Settle completed contract |
| GET | `/b2b/contracts/:id/milestones` | List contract milestones |
| POST | `/b2b/contracts/:id/milestones` | Add milestone |
| PATCH | `/b2b/contracts/:id/milestones/:mid` | Update milestone |
| GET | `/b2b/analytics/overview` | Org analytics overview |
| GET | `/b2b/compliance/verification` | Get org verification |
| POST | `/b2b/compliance/verification` | Submit verification |
| PATCH | `/b2b/compliance/verification/review` | Review verification |
| GET | `/b2b/compliance/reports` | List compliance reports |
| POST | `/b2b/compliance/reports` | Generate compliance report |
| GET | `/b2b/billing/plans` | List subscription plans |
| GET | `/b2b/billing/invoices` | List billing invoices |
| GET | `/b2b/billing/history` | Billing history |
| PUT | `/b2b/branding` | Get/update org branding |
| GET | `/b2b/config/public` | Public platform config |
| POST | `/calls/init` | Initialize video call |
| GET | `/calls/history` | Get call history |

## 4. marketplace-listings
**Path**: `supabase/functions/marketplace-listings/index.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/services` | List services |
| GET | `/listings` | List marketplace listings |
| GET | `/listings/:id` | Get listing detail |
| POST | `/listings` | Create listing |
| PATCH | `/listings/:id` | Update listing |
| DELETE | `/listings/:id` | Delete listing |

## 5. marketplace-orders
**Path**: `supabase/functions/marketplace-orders/index.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/orders` | List orders |
| GET | `/orders/:id` | Get order detail |
| POST | `/orders` | Create order |
| PATCH | `/orders/:id` | Update order status |
| GET | `/orders/:id/milestones` | List order milestones |
| POST | `/orders/:id/milestones` | Create milestone |
| PATCH | `/orders/:id/milestones/:mid` | Update milestone |
| GET | `/disputes` | List disputes |
| GET | `/disputes/:id` | Get dispute detail |
| GET | `/disputes/:id/messages` | Get dispute messages |

## 6. marketplace-payments
**Path**: `supabase/functions/marketplace-payments/index.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/payments/currencies` | List supported currencies |
| GET | `/payments/detect-currency` | Auto-detect user currency |
| GET | `/payments/service-fee` | Get service fee rate |
| GET | `/payments/service-fee` (with listing_id) | Fee for listing |
| POST | `/payments/service-fee` | Calculate fee |
| POST | `/payments/initialize` | Initialize payment |
| POST | `/payments/verify/:gateway` | Verify payment |
| POST | `/payments/release/:orderId` | Release escrow |
| POST | `/payments/release-milestone` | Release milestone escrow |
| GET | `/payments/offline-config` | Offline payment config |
| POST | `/payments/manual` | Submit manual payment |
| GET | `/payments/manual` | List manual payments |
| POST | `/payments/webhook/:gateway` | Gateway webhooks |

## 7. marketplace-reviews
**Path**: `supabase/functions/marketplace-reviews/index.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/reviews/listing/:id` | Reviews for a listing |
| GET | `/reviews/listing/:id/stats` | Avg rating for listing |
| GET | `/reviews/provider/:id` | Reviews for a provider |
| GET | `/reviews/provider/:id/stats` | Avg rating for provider |
| POST | `/reviews/orders/:id` | Submit review (buyer only) |
| PUT | `/reviews/orders/:id` | Edit review |
| DELETE | `/reviews/orders/:id` | Delete review (buyer/admin) |

## 8. messaging
**Path**: `supabase/functions/messaging/index.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/conversations` | Create conversation |
| GET | `/conversations` | List conversations |
| GET | `/conversations/:id` | Get conversation detail |
| GET | `/conversations/:id/messages` | List messages |
| POST | `/conversations/:id/messages` | Send message |

## 9. notifications
**Path**: `supabase/functions/notifications/index.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/notifications` | List notifications |
| GET | `/notifications/unread-count` | Get unread count |
| PATCH | `/notifications/read-all` | Mark all as read |
| PATCH | `/notifications/:id/read` | Mark single as read |

## 10. wallet-payouts
**Path**: `supabase/functions/wallet-payouts/index.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/wallet/balance` | Get wallet balance |
| GET | `/wallet/transactions` | List transactions |
| GET | `/payouts` | List payout requests |
| POST | `/payouts` | Create payout request |
| GET | `/bank-account` | Get saved bank account |
| POST | `/bank-account` | Save/update bank account |
| PATCH | `/payouts/:id` | Update payout (admin) |

## Summary

| Edge Function | Endpoints | Purpose |
|---------------|-----------|---------|
| admin-api | 19 | Admin operations |
| ai-assist | 1 | AI assistant |
| b2b-api | 50+ | B2B org platform |
| marketplace-listings | 6 | Listings CRUD |
| marketplace-orders | 10 | Orders + disputes |
| marketplace-payments | 12 | Payment processing |
| marketplace-reviews | 7 | Reviews & ratings |
| messaging | 5 | Conversations + messages |
| notifications | 4 | In-app notifications |
| wallet-payouts | 7 | Wallet + payouts |
| **Total** | **~120+** | |
