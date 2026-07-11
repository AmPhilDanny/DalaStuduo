# Gaps Analysis

## Critical Gaps (Blocking Production)

### 1. Zero Tests
**Severity**: HIGH
**Details**: No test files anywhere in the application code (`src/`, `admin/src/`). Only node_modules test files exist.
**Impact**: Cannot safely refactor, deploy, or verify features. Every change risks regression.
**Fix**: Set up Vitest + Playwright. Cover: auth flow, payment flow, B2B contract lifecycle, messaging.

### 2. No Email Notifications
**Severity**: HIGH
**Details**: `notifications` edge function exists (in-app only). No email sending infrastructure. `send-email` edge function doesn't exist yet.
**Impact**: Users only get notified when they're in-app. No email alerts for new messages, payment confirmations, dispute updates, contract changes.
**Fix**: Create `send-email` edge function (Resend/SendGrid), add email triggers to key events.

### 3. No Public/SEO Pages
**Severity**: HIGH
**Details**: Missing `/about`, `/faq`, `/contact`, `/terms`, `/privacy`. No meta tags, no sitemap, no JSON-LD.
**Impact**: Zero organic discovery. Professionals can't find the platform.
**Fix**: Create public pages, meta tag hook, sitemap generator.

### 4. No PWA / Offline Support
**Severity**: MEDIUM
**Details**: No service worker, no manifest, no offline fallback. Important for African mobile-first users.
**Impact**: Poor mobile experience, no "Add to Home Screen", no offline access.
**Fix**: Add vite-plugin-pwa, configure service worker with cache strategy.

### 5. No Onboarding Flow
**Severity**: MEDIUM
**Details**: New users land on empty dashboard with no guidance. No profile completion checklist.
**Impact**: Low activation rate. Users don't know what to do first.
**Fix**: Onboarding wizard (profile → role → first action), empty-state guides.

## Moderate Gaps

### 6. Admin Dashboard Single View
**Severity**: MEDIUM
**Details**: Admin app has only one route (`/`) with all features in one scrollable page. No navigation structure.
**Impact**: Hard to find features as admin panel grows. Not scalable.
**Fix**: Add sidebar navigation with tabs: Users, Services, Disputes, Payouts, Settings, Audit Log.

### 7. Admin Cannot Moderate Reviews
**Severity**: LOW
**Details**: `DELETE /reviews/orders/:id` supports admin deletion but there's no admin UI to browse/list reviews.
**Impact**: Admins can't discover flagged reviews to moderate them.
**Fix**: Add "Reviews" tab to admin dashboard with flagged review list.

### 8. No ReviewForm Component (Inline Only)
**Severity**: LOW
**Details**: Review form is only embedded inline in OrderDetail.tsx. Can't be reused elsewhere.
**Impact**: If we want review prompts elsewhere, need to duplicate.
**Fix**: Extract inline review code into dedicated ReviewForm component.

### 9. RatingBadge Not Wired with Live Data
**Severity**: LOW
**Details**: RatingBadge component exists but talent cards in TalentSearch don't fetch rating stats (no ratings data in search results).
**Impact**: Ratings not visible when browsing talent.
**Fix**: Add batch rating fetch or include rating in search API response.

### 10. Missing User-facing Public Routes
**Severity**: LOW
**Details**: Admin API has user management, but there's no "Forgot Password", email verification flow, or user-facing settings beyond profile.
**Impact**: Password recovery relies entirely on Supabase default UI.
**Fix**: Add password reset, email change, notification preferences pages.

## Technical Debt

### 11. Duplicate Review Functions
**Severity**: LOW
**Details**: During Sprint 4.5 work, duplicate review functions were added and then removed. Need to verify cleanup.
**Fix**: Already fixed. Verify build still passes.

### 12. Large Chunk Size Warning
**Severity**: LOW
**Details**: Build warns about chunks >500 kB (currently ~1.8 MB).
**Impact**: Slow initial load times.
**Fix**: Code-split with dynamic imports for heavy pages (admin, B2B, payments).

### 13. Supabase Type Safety
**Severity**: MEDIUM
**Details**: Several files use `as any` casts when accessing Supabase query results. No generated database types for B2B tables.
**Impact**: Runtime errors from type mismatches not caught at compile time.
**Fix**: Run `supabase gen types`, add missing table types.

### 14. Site Settings 406 Error
**Severity**: LOW
**Details**: Console shows repeated 406 errors fetching `site_settings` table. Either table missing or RLS blocking.
**Impact**: Home page errors logged but may not affect functionality.
**Fix**: Check if `site_settings` table exists and has proper RLS.

## Summary

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| P0 | No tests | Large | Blocks all safe development |
| P0 | No email notifications | Large | Users churn |
| P0 | No SEO/public pages | Medium | No discovery |
| P1 | No PWA | Medium | Poor mobile UX |
| P1 | No onboarding | Medium | Low activation |
| P2 | Admin navigation | Small | Admin usability |
| P2 | Type safety | Medium | Runtime errors |
| P3 | Code splitting | Small | Load time |
