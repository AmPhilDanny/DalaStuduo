# Sprint 2: Core B2B Features — Talent Search & Hiring

> **Duration:** 2 weeks
> **Goal:** Premium talent pool, bulk hiring, hiring pipeline
> **Dependencies:** Sprint 1 (org system, layout)

---

## Sprint Backlog

### Story 2.1: Premium Talent Pool Search
**Estimate:** 4 days  
**Priority:** P0

**Tasks:**
- [ ] Create `src/b2b/components/talent/TalentSearch.tsx` — Advanced talent search UI
- [ ] Filters: skills (multi-select), location, availability, rating, price range, verified only
- [ ] AI-powered matching: "Find me a React developer in Lagos available immediately"
- [ ] Saved searches (persist filter state)
- [ ] Talent result cards: avatar, name, headline, skills, rating, availability, hourly rate
- [ ] Pagination + infinite scroll
- [ ] Create `GET /b2b/talent/search` edge function with advanced filtering
- [ ] Create `GET /b2b/talent/saved` and `POST /b2b/talent/saved` endpoints
- [ ] Rate limiting for free tier

**Acceptance:**
- Search returns relevant profiles with accurate filters
- AI search understands natural language queries
- Saved searches persist across sessions
- Free tier limited to basic search; premium tiers unlock advanced

### Story 2.2: Bulk Job Posting
**Estimate:** 2 days  
**Priority:** P0

**Tasks:**
- [ ] Create `src/b2b/components/hiring/BulkJobPost.tsx` — CSV upload + bulk form
- [ ] Single job form with "Add Another" pattern (manageable for 1-5 jobs)
- [ ] CSV/Excel upload for 10+ jobs
- [ ] Preview before posting (show parsed jobs)
- [ ] Validation: required fields, duplicates detection
- [ ] Create `POST /b2b/jobs/bulk` edge function
- [ ] Subscribe to job approval notifications

**Acceptance:**
- Can post 1-50 jobs at once
- CSV template available for download
- Invalid rows reported without failing valid ones
- All jobs linked to org

### Story 2.3: Hiring Pipeline (Kanban)
**Estimate:** 4 days  
**Priority:** P0

**Tasks:**
- [ ] Create `src/b2b/components/hiring/PipelineView.tsx` — Kanban board
- [ ] Columns: New → Reviewed → Interviewed → Offer → Hired → Rejected
- [ ] Drag-and-drop to move applicants between stages
- [ ] Click applicant to view profile + application details
- [ ] Bulk actions: select multiple → batch update status
- [ ] Interview scheduling: propose time slots, calendar integration hint
- [ ] Create `PATCH /b2b/hiring/pipeline/:applicationId` endpoint
- [ ] Realtime updates via Supabase subscription
- [ ] Notifications when applicant moves stages

**Acceptance:**
- Drag-and-drop works smoothly
- Status changes sync to DB and other org members in realtime
- Bulk actions work for 50+ applicants
- Interview scheduling creates a message thread

### Story 2.4: Talent List Management
**Estimate:** 2 days  
**Priority:** P1

**Tasks:**
- [ ] Create "Save to list" button on talent cards
- [ ] Create named talent lists (e.g., "Frontend Candidates Feb", "Shortlist")
- [ ] List view shows all saved talent with notes
- [ ] Share list with team members
- [ ] Export list to CSV
- [ ] Edge function endpoints for list CRUD

**Acceptance:**
- Talent can be saved to multiple lists
- Lists are org-scoped (shared with team)
- Export produces valid CSV

### Story 2.5: Team Management UI
**Estimate:** 3 days  
**Priority:** P1

**Tasks:**
- [ ] Create `src/b2b/components/team/TeamList.tsx` — Table of team members
- [ ] Each row: avatar, name, email, role, joined date, status
- [ ] Create `src/b2b/components/team/InviteMember.tsx` — Invite dialog
- [ ] Role management: change role dropdown (admin/manager/viewer)
- [ ] Remove member with confirmation
- [ ] Pending invites list with resend/cancel
- [ ] Activity log per member

**Acceptance:**
- Invite sends email with join link
- Role changes take effect immediately
- Owner role cannot be removed or demoted
- At least one owner must remain

---

## Definition of Done
- ✅ All features work on free and paid tiers appropriately
- ✅ RLS enforces org data isolation
- ✅ LSP diagnostics clean
- ✅ Responsive design
- ✅ Edge function JWT auth verified

## Risks & Mitigations
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Kanban drag-animation performance | Medium | Use lightweight library, lazy-load cards |
| AI search quality | Medium | Fall back to keyword search; AI as enhancement |
| Orphaned invites | Low | Cleanup job for expired invites |
