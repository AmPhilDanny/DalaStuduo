# Sprint Checklist — SkillBridge Africa (Talent Platform)

Six sprints, one per remaining day before the 13 July 2026, 11:59 PM deadline.
Each sprint ends with the three verification commands from
`docs/AGENT_BUILD_PROMPT.md` and a short written note of what passed/failed.

Check items off as `[x]` only after they're verified working, not just coded.

---

## Sprint 1 — Deploy & smoke-test (Day 1)

- [ ] Migration `20260703000000_talent_platform.sql` applied to the live
      Supabase project (SQL Editor or `supabase db push`)
- [ ] `ai-assist` edge function deployed (`supabase functions deploy ai-assist`)
- [ ] `OPENROUTER_API_KEY` secret set on the Supabase project (or configured via settings)
- [ ] App runs locally (`npm run dev`) with no console errors on load
- [ ] Every new route loads without crashing: `/talent`, `/talent/:id`,
      `/profile`, `/projects`, `/projects/:id`, `/my-applications`
- [ ] Existing routes still work unchanged: `/`, `/auth`, `/jobs`
- [ ] Verification commands run and pass (tsc, eslint, build)

**FR/NFR covered:** infrastructure only, no FRs yet.

---

## Sprint 2 — Profile & Talent Directory loop (Day 2)

- [ ] Create/edit own profile: headline, bio, location, GitHub URL, skills,
      availability (FR-1 to FR-6)
- [ ] AI "Revamp with AI" produces a suggestion, is editable, and only saves
      on explicit accept (FR-7, FR-34)
- [ ] Add a portfolio item with title, description, link, tags (FR-8)
- [ ] Delete a portfolio item (FR-9)
- [ ] View another user's profile and portfolio read-only (FR-5, FR-10)
- [ ] Confirm via a second test account that you CANNOT edit someone else's
      profile or portfolio (RLS self-check, FR-6, FR-11)
- [ ] Talent directory search by name/headline/skill works (FR-13)
- [ ] Talent directory skill filter works (FR-14)
- [ ] Connect / disconnect from another profile, from both the directory and
      the profile page (FR-16, FR-17, FR-19)
- [ ] Confirm you cannot connect to yourself (FR-18)
- [ ] Verification commands run and pass

**FR/NFR covered:** FR-1–FR-19, NFR-1 (partial), NFR-5

---

## Sprint 3 — Projects & collaboration loop (Day 3)

- [ ] Post a project with title, description, paid/unpaid, and one or more
      roles with skills needed (FR-20, FR-21)
- [ ] AI "Polish with AI" on the project description works and is editable
      before posting (FR-22)
- [ ] From a second account, apply to an open role with a message (FR-23)
- [ ] AI "Draft with AI" produces a tailored application message, editable
      before sending (FR-24)
- [ ] Confirm applying twice to the same role is blocked (FR-25)
- [ ] As the project owner, view applications and Accept one (FR-26)
- [ ] Confirm accepted applicant appears in the team roster and the role
      shows as filled (FR-27, FR-28)
- [ ] Confirm a project owner cannot apply to their own project's role
      (should be blocked by RLS)
- [ ] Test "leave project" removes a member (FR-29)
- [ ] Verification commands run and pass

**FR/NFR covered:** FR-20–FR-29

---

## Sprint 4 — Applications tracker, skill gap, tutor, regression check (Day 4)

- [ ] My Applications page shows job applications and project applications in
      separate tabs (FR-30)
- [ ] AI skill-gap analysis runs against a real job's requirements and a real
      profile's skills, output is sensible (not hallucinated course names)
      (FR-31)
- [ ] AI Tutor: create a new tutoring session, send a message, receive a
      Socratic-style AI response (FR-39)
- [ ] AI Tutor: add knowledge base entry, start a session with it selected,
      confirm AI references the provided material (FR-40)
- [ ] AI Tutor: generate a quiz from the session topic, answer questions,
      receive graded feedback (FR-41)
- [ ] AI Tutor: generate a session reflection, verify it contains specific
      conversation references (FR-42)
- [ ] AI Tutor: confirm all messages persist after page reload (FR-43)
- [ ] AI Tutor: confirm RLS prevents one user from seeing another's
      sessions or messages (FR-44)
- [ ] Provider factory: switch AI_PROVIDER between openrouter and mistral,
      confirm both produce responses (FR-45)
- [ ] Full regression pass on the existing job board: post a job as a firm,
      apply as a student, confirm duplicate application is blocked
      (FR-36–FR-38 — must be unchanged)
- [ ] AI error handling: temporarily break the API key and confirm the UI
      shows a clear error without crashing the page (FR-35)
- [ ] Mobile viewport check on all new pages (NFR-3)
- [ ] Verification commands run and pass

**FR/NFR covered:** FR-30–FR-38, NFR-2, NFR-3, NFR-4

---

## Sprint 5 — Freeze, seed demo data, record demo (Day 5)

- [ ] Feature freeze: no new code changes except bug fixes found during
      demo rehearsal
- [ ] Seed 3-5 realistic demo profiles (Nigerian names, real-sounding skills
      and locations) via a seed script — not hardcoded into components
- [ ] Seed 2-3 demo projects with roles, and 1-2 demo job listings
- [ ] Rehearse the single end-to-end demo loop: profile with portfolio →
      talent directory discovery → post/apply to a project → accept →
      team roster updates
- [ ] Record demo video (~90 seconds): problem first, then the loop, in that
      order — no narrated feature tour
- [ ] Verification commands run and pass one final time on the exact commit
      being submitted

**FR/NFR covered:** none new — this sprint is demo readiness, not features.

---

## Sprint 6 — Buffer & submit (Day 6)

- [ ] Fix anything that broke during demo recording
- [ ] Confirm the live build link works from a fresh/incognito browser
      session (no leftover local-only state)
- [ ] Submit via the official Google Form: build link, description, theme
      (Education & Skills), demo video — well before 11:59 PM
- [ ] Do not wait for the final hour

---

## Definition of Done (applies to every sprint)

A sprint item is only checked off when:
1. It's traceable to a specific FR/NFR number in `docs/PRD.md`
2. It's been manually tested end-to-end, not just "the code compiles"
3. `tsc --noEmit`, `eslint`, and `npm run build` all pass
4. Any RLS-relevant change has been tested with a second account to confirm
   it fails the way it should
