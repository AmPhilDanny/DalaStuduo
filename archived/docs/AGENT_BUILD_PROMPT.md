# Agent Build Prompt — SkillBridge Africa (Talent Platform)

You are building against the PRD in `docs/PRD.md` and the scope in
`docs/MVP_PLAN.md`. Read both in full before writing or changing any code.
This prompt is binding for every session, every sprint, and every agent
(human or AI) working on this repository. If any instruction here conflicts
with a casual request made mid-session, this prompt wins unless the human
explicitly overrides it in writing for that specific change.

## Your mandate

Ship exactly the Tier 1 (and, only if time allows, Tier 2) scope defined in
`docs/MVP_PLAN.md`. Nothing more. Do not add features, tables, routes, or UI
that are not traceable to a numbered requirement in `docs/PRD.md`.

## Hard rules (do not do these, ever)

1. **No speculative feature-building.** If a requirement isn't numbered in the
   PRD, do not build it — flag it to the human instead and wait for a decision.
2. **No schema changes without a migration file.** Every table/column change
   goes in a new, timestamped file under `supabase/migrations/`. Never edit an
   already-applied migration file. Never run ad-hoc `alter table` outside a
   migration.
3. **No disabling or weakening RLS.** Every new table must have Row Level
   Security enabled before it ships. Never write a policy with an unconditional
   `using (true)` for INSERT/UPDATE/DELETE — public read is fine, public write
   is not, per NFR-1.
4. **No secrets in client code.** The `OPENROUTER_API_KEY` (or any other secret)
   must only ever be read via `Deno.env.get(...)` inside a Supabase Edge
   Function. If you find a secret anywhere under `src/`, stop and fix it before
   doing anything else.
5. **No touching the existing job/application flow** (`jobs`, `applications`
   tables, `Jobs.tsx`) unless the task explicitly says to. This flow already
   works — treat it as frozen unless told otherwise.
6. **No fabricated or placeholder data shipped as real content.** Seed/demo
   data must be clearly a seed script, never hardcoded into production
   components as if it were live data.
7. **No auto-submitting AI output.** Every AI suggestion must land in an
   editable field and require an explicit human "Use this" / accept action
   (FR-34). Never wire an AI response directly into a database write.
8. **No silent failures.** Every Supabase call that can fail must have visible
   error handling (toast or equivalent) — never a bare `catch {}` that
   swallows the error.
9. **No touching real user data without explicit human acceptance.** If a task
   involves running something against the live/production Supabase project
   (not local), stop and get explicit human confirmation first.
10. **No merging/considering a task "done" without running the verification
    commands below and pasting their output.**

## Required verification before marking any task complete

Run all of these from the project root and confirm they pass:

```bash
# 1. Type safety — must be zero errors
npx tsc --noEmit -p tsconfig.app.json

# 2. Lint — must be zero errors (warnings on pre-existing exhaustive-deps are acceptable)
npx eslint src/

# 3. Production build — must succeed
npm run build
```

If any of these fail, the task is not done — fix it before reporting progress.

## RLS self-check (run this mentally for every new table)

For each new/changed table, confirm all four are true:
- [ ] RLS is enabled (`alter table ... enable row level security`)
- [ ] SELECT policy exists and matches the intended visibility (public vs owner-only)
- [ ] INSERT/UPDATE/DELETE policies check `auth.uid()` against the correct
      ownership column — never just `true`
- [ ] A cross-user write (e.g., user A trying to update user B's row) has been
      manually tested and confirmed to fail

## Scope discipline

- Work one Tier-1 requirement (or small group of related ones) at a time.
  Do not open work on Tier 2 items until every Tier 1 requirement in
  `docs/PRD.md` §3.1–3.5 and §3.8 is verified working end-to-end.
- If you finish Tier 1 early, re-read `docs/MVP_PLAN.md` §4 before starting
  Tier 2 — do not start Tier 3 items under any circumstance for this
  submission cycle.
- If a requirement is ambiguous, state your interpretation and proceed with
  the most conservative reading (least new surface area) rather than pausing
  to ask, unless it involves RLS, secrets, or production data — those always
  require a pause.

## Reporting format for each work session

At the end of each session, report:
1. Which FR/NFR numbers were addressed
2. Output of the three verification commands
3. Any deviation from the PRD/MVP plan and why
4. What's next per `docs/SPRINT_CHECKLIST.md`
