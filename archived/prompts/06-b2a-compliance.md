# Prompt: B2A Compliance & Verification System

> **Target:** `src/b2b/pages/B2BCompliance.tsx` + verification workflow
> **When to use:** Sprint 3
> **Agent role:** Security/Compliance Engineer + Frontend Engineer

---

## Prompt

```
TASK: Build the B2A (Business-to-Administration) compliance and verification system.

EXPECTED OUTCOME: A compliance module enabling government, NGO, and enterprise clients to verify their organization, generate audit-ready compliance reports, and maintain a tamper-proof audit trail.

REQUIRED TOOLS: Read (existing admin_audit_log, profiles, site_settings), Write (new page + API)

MUST DO:

1. Create compliance edge function endpoints in b2b-api:

   POST /b2b/compliance/verify — Submit org for verification
   - Body: { tax_id, business_registration_url, kyc_document_url, country }
   - Set verification_status to 'pending'
   - Create audit log entry
   - Notify platform admin

   GET /b2b/compliance/status — Get current verification status
   - Return verification_status + any rejection notes

   GET /b2b/compliance/report — Generate compliance report
   - Query params: type (hiring_diversity|local_content|spend_distribution), from, to
   - Generate structured JSON report
   - Return: { data: { report_type, generated_at, org_name, data: {...} } }

   GET /b2b/compliance/audit-log — Org-scoped audit trail
   - Entries from admin_audit_log filtered to current org
   - Paginated, filterable by action type and date range

2. Create `src/b2b/pages/B2BCompliance.tsx`:
   - Tab navigation: Verification | Compliance Reports | Audit Trail
   - Verification tab:
     - Current status badge (Unverified/Pending/Verified/Rejected)
     - If unverified: form to submit tax ID, upload business registration, upload KYC
     - If pending: "Under Review" message with ETA
     - If verified: green checkmark, verified badge, verification date
     - If rejected: red badge with rejection reason, re-submit button
   - Compliance Reports tab:
     - Report type selector (Hiring Diversity, Local Content, Spend Distribution)
     - Date range selector
     - "Generate Report" button
     - Report preview with data tables
     - "Download PDF" button
   - Audit Trail tab:
     - Filterable table: date, action, user, details
     - Search and date range filter
     - Export to CSV

3. Admin review panel (extend AdminDashboard):
   - Add "Verification Requests" tab to admin panel
   - Table: org name, submitted date, documents (links), status
   - Approve/Reject buttons with notes field
   - On approval: set verification_status='verified', send notification
   - On rejection: set verification_status='rejected', include rejection reason

4. Compliance report generation:
   - Hiring Diversity: count of hires by: gender (if available), location, skills category
   - Local Content: percentage of local vs international hires
   - Spend Distribution: total spend by service category, by region
   - Reports generated as structured JSON with human-readable summary
   - PDF download via HTML-to-PDF conversion

MUST NOT DO:
- Don't store sensitive documents (tax IDs, KYC) unencrypted
- Don't display personal data (emails, phone numbers) in compliance reports
- Don't allow orgs to see other orgs' compliance data
- Don't skip verification for self-service (admin must approve)
- Don't expose raw document URLs without auth check

CONTEXT:
- Verification documents should be stored in Supabase Storage in a 'compliance-docs' bucket
- Access to compliance docs restricted to org admins + platform admins
- admin_audit_log already has: admin_id, action, entity_type, entity_id, details, created_at
- The existing AdminDashboard is at src/pages/AdminDashboard.tsx — add a new tab there
- Profiles have fields: full_name, location, skills (used for diversity reporting)
- Compliance reports are for enterprise and government clients — accuracy matters
```

---

## Verification Checklist
- [ ] Verification workflow works end-to-end: submit → pending → admin review → approved/rejected
- [ ] Documents upload securely to compliance-docs bucket
- [ ] Compliance reports reflect accurate data
- [ ] PDF download produces readable document
- [ ] Audit trail shows all org-relevant actions
- [ ] Admin review interface works
- [ ] RLS prevents cross-org data access
- [ ] Verification badges display correctly in dashboard
