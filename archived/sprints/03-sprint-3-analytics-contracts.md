# Sprint 3: Analytics, Contracts & B2A Compliance

> **Duration:** 2 weeks
> **Goal:** Enterprise contracts, analytics dashboard, B2A compliance reports
> **Dependencies:** Sprints 1-2 (org system, talent search)

---

## Sprint Backlog

### Story 3.1: Enterprise Contract Management
**Estimate:** 4 days  
**Priority:** P0

**Tasks:**
- [ ] Create `src/b2b/components/contracts/ContractList.tsx` — Table of contracts
- [ ] Create `src/b2b/components/contracts/ContractViewer.tsx` — Contract detail view
- [ ] Contract types: MSA (Master Services Agreement), SOW (Statement of Work), Fixed-price, Milestone-based
- [ ] Contract creation wizard: pick talent, define scope, set terms, add milestones
- [ ] Contract status workflow: Draft → Sent → Signed → Active → Completed
- [ ] Milestone tracking with approval flow
- [ ] Contract PDF generation (or structured document view)
- [ ] Signature workflow (digital acknowledgment)
- [ ] Edge function endpoints for full contract CRUD + lifecycle
- [ ] Notifications: contract signed, milestone completed, payment due

**Acceptance:**
- Contracts link to both org and individual talent
- Milestones can be created with amounts, due dates, deliverables
- Status transitions are validated (no skipping steps)
- Contract terms stored as structured JSONB

### Story 3.2: Analytics Dashboard
**Estimate:** 3 days  
**Priority:** P0

**Tasks:**
- [ ] Create `src/b2b/components/analytics/HiringMetrics.tsx` — Hiring funnel visualization
- [ ] Metrics: applications per job, time-to-hire, offer acceptance rate, source effectiveness
- [ ] Create `src/b2b/components/analytics/SpendReport.tsx` — Spend tracking
- [ ] Charts: total spend by month, by talent, by department
- [ ] ROI metrics: cost-per-hire, value generated vs spend
- [ ] Create `src/b2b/components/analytics/TalentROI.tsx` — Talent performance analytics
- [ ] Export to PDF/CSV for stakeholder reporting
- [ ] Edge function endpoints: GET /b2b/analytics/hiring, GET /b2b/analytics/spend, GET /b2b/analytics/talent
- [ ] AI-powered insights: "Your time-to-hire decreased 20% this quarter"

**Acceptance:**
- Charts render with real org data
- Date range filtering works
- Exports produce valid PDF/CSV
- AI insights are relevant and accurate

### Story 3.3: B2A Compliance & Verification
**Estimate:** 3 days  
**Priority:** P0

**Tasks:**
- [ ] Create `src/b2b/components/compliance/VerificationBadge.tsx` — Org verification status
- [ ] Org verification flow: submit business registration, tax ID, KYC docs
- [ ] Admin review panel for verification (extend admin dashboard)
- [ ] Create `src/b2b/components/compliance/ComplianceReport.tsx` — Generate compliance reports
- [ ] Report types: hiring diversity, local content, spend distribution
- [ ] Create `src/b2b/components/compliance/AuditLog.tsx` — Org audit trail
- [ ] Edge function endpoints for compliance report generation
- [ ] PDF report download

**Acceptance:**
- Verification documents upload to secure storage
- Compliance reports reflect real org data
- Audit log captures all org actions (member changes, contract actions)
- Reports downloadable as PDF

### Story 3.4: Subscription Management & Billing
**Estimate:** 3 days  
**Priority:** P1

**Tasks:**
- [ ] Create pricing page showing all tiers with feature comparison
- [ ] Create `src/b2b/components/settings/Subscription.tsx` — Plan management UI
- [ ] Free → Paid upgrade flow via existing payment system
- [ ] Plan change: upgrade/downgrade with proration
- [ ] Invoice history table
- [ ] Payment method management
- [ ] Downgrade confirmation: warn about feature loss
- [ ] Cancel subscription with offboarding
- [ ] Edge function endpoints for plan changes

**Acceptance:**
- Upgrade redirects to payment flow
- Downgrade shows feature impact warning
- Invoices accessible from dashboard
- Plan change takes effect immediately or at period end

### Story 3.5: White-Label Settings
**Estimate:** 2 days  
**Priority:** P2 (Enterprise only)

**Tasks:**
- [ ] Create `src/b2b/components/settings/WhiteLabel.tsx` — White-label configuration
- [ ] Custom logo upload
- [ ] Custom primary color / brand theme
- [ ] Custom domain configuration
- [ ] Custom email templates for hiring communications
- [ ] "Powered by SkillBridge" toggle

**Acceptance:**
- Logo and colors apply across the org's portal
- Custom domain DNS instructions provided
- Changes preview in real-time

---

## Definition of Done
- ✅ Charts render correctly with real data
- ✅ PDF exports produce well-formatted documents
- ✅ Contract lifecycle fully functional
- ✅ Compliance reports pass audit review
- ✅ Payment integration works with existing gateways
- ✅ LSP diagnostics clean

## Risks & Mitigations
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| PDF generation complexity | Medium | Use structured HTML-to-PDF via edge function |
| Compliance report accuracy | Low | Cross-reference with actual DB queries |
| Payment integration bugs | Medium | Extend existing payments system, don't rebuild |
