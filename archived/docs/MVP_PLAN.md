# MVP Plan — SkillBridge Africa (Talent Platform)
**Competition:** Airtel NextGen / 3MTT Knowledge Showcase 2.0 — Education & Skills track
**Submission deadline:** 13 July 2026, 11:59 PM
**Plan written:** 7 July 2026 (6 build days remaining)

---

## 1. The Problem

African tech talent — students, self-taught builders, out-of-school youth with real
skill — has no level playing field to be *seen*. Job boards only serve people who
already have a CV polished enough to apply. There's no easy way to:

- Show real work, not just claim skills on a form
- Be discovered by someone looking for a specific skill, independent of a job posting
- Find collaborators to build something with, paid or not
- Get help turning rough self-description into something that reads as strong

This traps capable people behind a wall of "no experience, no visibility."

## 2. Who this is for

- **Students / builders** — want to showcase work, get discovered, join or start
  projects, find paid work.
- **Firms** — want to discover vetted talent and post paid roles (existing flow, unchanged).
- **Anyone with a project idea** — student, firm, or hobbyist — wants collaborators,
  paid or unpaid.

## 3. Core user journeys (in priority order)

1. **Showcase** — build a profile with a headline, bio, skills, and real portfolio items.
2. **Discover** — browse/search the talent directory by skill, not just by job fit.
3. **Collaborate** — post a project needing specific roles, or apply to join one.
4. **Connect** — follow another techie independent of any job or project.
5. **Get AI help** — revamp a rough bio, draft an application message, get a skill-gap
   read against a target role, polish a project pitch.
6. **Apply for paid work** — existing job board flow (already built, unchanged).

## 4. MVP scope — what ships for the Showcase

### Tier 1 — must work end-to-end for the demo (already built, needs verification + polish)
- Profile: headline, bio, location, GitHub link, skills, availability status
- Portfolio: add/view/delete portfolio items (title, description, link, tags)
- Talent directory: browse, search, filter by skill, connect/follow
- Projects: post a project with named roles + required skills
- Project applications: apply to a specific role with a message; owner accepts/rejects
- Project team: accepted applicants appear as project members
- AI CV revamp (profile bio)
- AI cover-letter draft (project role application)
- Existing job board + job applications (must not regress)

### Tier 2 — include if time allows after Tier 1 is demo-solid
- AI skill-gap analysis on My Applications
- AI project-pitch polish
- AI Tutor — interactive Socratic tutoring with knowledge base, quiz generation, and session reflection

### Tier 3 — explicitly out of scope for this submission
- Messaging/chat between users
- Notifications (email/SMS/in-app)
- Ratings or formal endorsements
- Skill verification quizzes/certifications
- Vendor/services marketplace (students offering paid services directly)

Cutting Tier 3 is a deliberate choice, not an oversight — a fully working Tier 1
loop beats a half-built Tier 2/3 feature in front of judges.

## 5. Success criteria (mapped to judging rubric)

| Judging criterion | How this MVP addresses it |
|---|---|
| Relevance | Talent-first framing directly answers "no level playing field to shine" for African tech talent |
| Innovation | Project-based collaboration + connections is a genuine departure from a generic job board |
| Functionality | One complete loop (profile → portfolio → post/apply to project → accept → team) must run live, no mock data |
| Impact potential | Serves students without a paid-work CV yet, not just job-ready applicants |
| Presentation quality | Demo script rehearsed around a single real loop, ~90 seconds |

## 6. Timeline (6 days to submission)

| Day | Focus |
|---|---|
| Day 1 (today) | Apply migration to live Supabase project, deploy AI edge function, smoke-test every route |
| Day 2 | Fix anything broken in Tier 1; test the full project-collaboration loop with two real accounts |
| Day 3 | Fix anything broken in AI flows (cv_revamp, cover_letter); confirm RLS blocks cross-user writes |
| Day 4 | Tier 2 items if Tier 1 is solid; otherwise polish copy/empty states/mobile view |
| Day 5 | Freeze features. Seed realistic demo data (real-sounding Nigerian names/skills/projects). Record demo video. |
| Day 6 | Buffer day. Submit early — do not wait for 13 July 11:59 PM. |

## 7. Non-goals for this cycle
- Scaling, load handling, or production hardening beyond Supabase defaults
- Full accessibility audit (basic keyboard/contrast only)
- Native mobile app (responsive web is sufficient)
