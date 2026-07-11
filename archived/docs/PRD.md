# Product Requirements Document — SkillBridge Africa (Talent Platform)
**Version:** 2.0 (talent-first extension)
**Status:** Active build for Airtel NextGen / 3MTT Knowledge Showcase 2.0
**Owner:** Amaechi

---

## 1. Overview

SkillBridge Africa is a talent-first platform for African tech builders. It lets
people showcase real work, get discovered by skill, form project teams, and
optionally find paid work — with AI assistance for self-presentation at each step.

This PRD covers the talent-platform extension (profiles, portfolio, projects,
connections, AI assist) layered on top of the existing, unchanged job marketplace
(`jobs`, `applications`).

## 2. User roles

- **Student / Talent** — any authenticated user with `role = 'student'`. Can build
  a profile, portfolio, post/join projects, connect with others, apply to jobs.
- **Firm** — any authenticated user with `role = 'firm'`. Can post paid jobs, review
  job applicants. Firms can also browse the talent directory and post/join projects
  like any other user — role does not gate project participation.
- **Anonymous / signed-out visitor** — can browse the talent directory, project
  listings, and job board read-only. Must sign in to apply, post, or connect.

## 3. Functional Requirements

### 3.1 Profile & Showcase

- **FR-1**: A user can set a `headline` (short professional title, max 120 chars).
- **FR-2**: A user can set a `bio` (free text).
- **FR-3**: A user can set `location`, `github_url`, and `availability`
  (`open_to_work` | `open_to_collab` | `not_available`).
- **FR-4**: A user can add/remove tag-style `skills` on their own profile.
- **FR-5**: Any authenticated user can view any other user's public profile.
- **FR-6**: Only the profile owner can edit their own profile fields. Enforced by RLS.
- **FR-7**: A user can request an AI-drafted rewrite of their bio (`cv_revamp` mode),
  shown as an editable suggestion that must be explicitly accepted before saving.

### 3.2 Portfolio

- **FR-8**: A user can add a portfolio item: `title` (required), `description`,
  `project_url`, `tags`.
- **FR-9**: A user can delete their own portfolio items.
- **FR-10**: Any authenticated user can view another user's portfolio items.
- **FR-11**: Only the owner can create, update, or delete their own portfolio items.
  Enforced by RLS.

### 3.3 Talent Directory

- **FR-12**: Any authenticated user can browse a directory of talent (`role = 'student'`
  profiles).
- **FR-13**: The directory supports free-text search across name, headline, and skills.
- **FR-14**: The directory supports filtering by a single skill tag.
- **FR-15**: Each directory card shows availability status, location, top skills, and
  a Connect action.

### 3.4 Connections

- **FR-16**: A user can follow ("connect with") another user. One-directional,
  no approval required.
- **FR-17**: A user can unfollow a user they previously connected with.
- **FR-18**: A user cannot connect with themselves. Enforced by DB constraint.
- **FR-19**: Connection state (following/not following) is reflected on both the
  directory and profile views.

### 3.5 Projects (collaboration, distinct from paid `jobs`)

- **FR-20**: Any authenticated user can post a project: `title`, `description`,
  `is_paid` (boolean), `status` (`open` | `in_progress` | `completed`).
- **FR-21**: A project owner can define one or more `project_roles`, each with a
  `role_title` and `skills_needed`.
- **FR-22**: A project owner can request an AI-polished rewrite of their project
  description (`project_polish` mode) before posting.
- **FR-23**: Any authenticated user except the project owner can apply to an open,
  unfilled role with an optional message.
- **FR-24**: An applicant can request an AI-drafted application message
  (`cover_letter` mode) tailored to the role and project, editable before sending.
- **FR-25**: A user cannot apply to the same role twice. Enforced by unique DB
  constraint.
- **FR-26**: A project owner can view all applications to their project and
  accept or reject each one.
- **FR-27**: Accepting an application adds the applicant to `project_members` and
  marks the corresponding role as filled.
- **FR-28**: Project members and the public can view the current team roster for
  a project.
- **FR-29**: A member can remove themselves from a project ("leave").

### 3.6 Applications tracking

- **FR-30**: A user can view all their own job applications and project
  applications in one place, grouped by type.
- **FR-31**: Each job application in this view can trigger an AI skill-gap
  analysis (`skill_gap` mode) comparing the user's listed skills against the
  job's stated requirements.

### 3.7 AI Assist (cross-cutting)

- **FR-32**: All AI requests are proxied through a single server-side Supabase
  Edge Function (`ai-assist`). The AI API key (OpenRouter) must never be present in
  client-side code or bundles.
- **FR-33**: The AI edge function must reject any request without a valid
  Supabase auth session.
- **FR-34**: Every AI suggestion is presented in an editable field and requires
  an explicit user action ("Use this") before it is written into any form state.
  No AI output is ever auto-submitted.
- **FR-35**: AI failures (network error, missing API key, non-2xx response) must
  surface a clear, non-blocking error to the user — the rest of the page must
  remain usable.

### 3.8 Existing job marketplace (unchanged, must not regress)

- **FR-36**: Firms can post, edit, and view applicants for jobs (existing behavior).
- **FR-37**: Students can browse jobs and submit one application per job
  (existing behavior).
- **FR-38**: All existing RLS policies on `jobs` and `applications` remain intact
  and untouched by this extension.

## 4. Non-functional requirements

- **NFR-1**: Every new table has Row Level Security enabled with policies that
  match the ownership/visibility rules above — no table is left with RLS
  disabled or a permissive `true` write policy.
- **NFR-2**: The app must remain usable on a slow/unstable connection: no action
  should silently fail without a toast/error message.
- **NFR-3**: The app must be usable on mobile viewport widths (existing
  responsive patterns from the job board apply to all new pages).
- **NFR-4**: No AI-related secret may appear in any file under `src/` or in the
  built client bundle.
- **NFR-5**: TypeScript strict compilation (`tsc --noEmit`) and `npm run build`
  must both pass with zero errors before any sprint is marked complete.

## 5. Data model summary

| Table | Purpose | Owner-write RLS |
|---|---|---|
| `profiles` (extended) | Identity + showcase fields | Self only |
| `portfolio_items` | Proof-of-work entries | Owner only |
| `projects` | Collaboration project posts | Owner only |
| `project_roles` | Roles needed on a project | Project owner only |
| `project_applications` | Applications to a role | Applicant inserts; project owner updates status |
| `project_members` | Accepted team roster | Project owner inserts/removes; member can remove self |
| `connections` | One-directional follow | Follower only |
| `jobs`, `applications` | Existing paid job flow | Unchanged |

## 6. Out of scope (this cycle)

Messaging/chat, notifications, ratings/endorsements, skill verification/quizzes,
a dedicated paid-services vendor marketplace. These remain on the long-term
roadmap but are explicitly excluded from this submission's build and from any
agent's task list.
