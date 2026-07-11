# 🏢 SkillBridge B2B/B2A — Premium Business Platform

> **Initiative:** Enterprise-Grade B2B & B2A Features for SkillBridge Africa
> **Status:** Planning Phase
> **Last Updated:** 2026-07-09

---

## Overview

Transform SkillBridge Africa from a student/talent marketplace into a **premium B2B/B2A platform** where African firms, enterprises, NGOs, and government organizations hire, manage, and pay for tech talent at scale.

**Product Vision:** *"Every African organization should be able to discover, hire, and manage world-class tech talent as easily as browsing a marketplace."*

---

## Document Map

```
achieve/
├── README.md                          ← You are here
├── findings/
│   ├── 01-current-state-analysis.md   # What exists today (gaps & opportunities)
│   └── (placeholder for research results)
├── plans/
│   ├── 01-b2b-architecture-plan.md    # Full architecture, schema, tiers, phases
│   └── (placeholder for detailed specs)
├── sprints/
│   ├── 01-sprint-1-foundation.md      # Orgs, members, subscription, layout
│   ├── 02-sprint-2-core-b2b.md        # Talent search, bulk hiring, pipeline
│   └── 03-sprint-3-analytics-contracts.md # Analytics, contracts, B2A, white-label
└── prompts/
    ├── 01-create-orgs-tables.md       # Database migration prompt
    ├── 02-b2b-edge-function.md        # Backend API prompt
    ├── 03-b2b-frontend-dashboard.md   # Frontend dashboard + layout prompt
    ├── 04-b2b-talent-search.md        # Premium talent search prompt
    ├── 05-b2b-analytics-ai.md         # Analytics + AI insights prompt
    └── 06-b2a-compliance.md           # Compliance & verification prompt
```

---

## Architecture Decision

**B2B module lives inside `Skillbridge/src/b2b/`** as an isolatable module (not a separate app).

Rationale documented in `plans/01-b2b-architecture-plan.md`.

---

## Quick Reference

| Sprint | Focus | Duration | Key Deliverable |
|--------|-------|----------|-----------------|
| 1 | Foundation | 2 weeks | Orgs, members, auth, layout, subscriptions |
| 2 | Core B2B | 2 weeks | Talent search, bulk hiring, Kanban pipeline |
| 3 | Enterprise | 2 weeks | Analytics, contracts, B2A compliance, white-label |
| 4 | Scale | 2 weeks | API access, custom onboarding, government portal |

---

## Key Contacts

| Role | Persona |
|------|---------|
| **Product Owner** | You (driving the vision) |
| **Product Engineer** | Sisyphus (architecture & execution) |
| **Customer Success** | Ensures firms onboard successfully |
| **Compliance Officer** | B2A requirements gathering |

---

## Success Metrics

- [ ] **100+ organizations** onboarded in first quarter post-launch
- [ ] **30% conversion** from free to paid within 90 days
- [ ] **< 5min time-to-first-hire** for premium users
- [ ] **Zero data breaches** (compliance-ready from day one)
- [ ] **NPS > 40** from enterprise customers
