# SkillBridge Africa — Demo Script (~90 seconds)

## Setup
- Open `http://localhost:3000/` in your browser
- Have screen recording ready (OBS, Windows Game Bar, etc.)
- Demo accounts password: `DemoPass123!`

---

## Script (read naturally, ~90 sec)

### 1. The Problem (0-15 sec)
> "African tech talent struggles to get discovered. Students build great projects but can't showcase them to employers. Firms can't find verified talent. SkillBridge Africa bridges that gap."

### 2. Sign In & Profile (15-30 sec)
> "Start by signing in as Sarah Johnson, a Lagos-based full-stack developer."

1. Go to `http://localhost:3000/auth`
2. Sign in: `sarah.johnson@example.com` / `DemoPass123!`
3. Navigate to `/profile` — show her headline "Full-Stack Developer & UI/UX Enthusiast", skills (React, TypeScript, Tailwind CSS, Node.js, Figma), and bio

### 3. Talent Directory (30-45 sec)
> "Let's discover other talent. The directory shows developers by skill and availability."

1. Go to `/talent`
2. Show the list: David Okafor (Mobile Developer), Amina Bello (Data Scientist), Chidi Okonkwo (Backend Engineer)
3. Click on David Okafor's profile to view his portfolio and skills

### 4. Browse & Post Projects (45-60 sec)
> "Students collaborate on projects. Here are active projects looking for team members."

1. Go to `/projects` — show the 3 seeded projects
2. _(Optional: Post a new project as Sarah — title, description, paid/unpaid, roles with skills)_
3. Show a project detail page: roles listed, skills needed

### 5. Jobs & Apply (60-75 sec)
> "Firms post internships and part-time roles. TechCorp Nigeria has two open positions."

1. Go to `/jobs` — show Frontend Developer Intern and Data Entry Specialist
2. Click into a job listing to see full details: requirements, salary range, location

### 6. Close (75-90 sec)
> "SkillBridge Africa connects African tech builders with opportunities — through profiles, projects, and jobs. All in one platform."

---

## Demo Accounts

| Name | Email | Role |
|------|-------|------|
| Sarah Johnson | sarah.johnson@example.com | Student (Full-Stack Dev) |
| David Okafor | david.okafor@example.com | Student (Mobile Dev) |
| Amina Bello | amina.bello@example.com | Student (Data Scientist) |
| Chidi Okonkwo | chidi.okonkwo@example.com | Student (Backend Eng) |
| TechCorp Nigeria | techcorp.ng@example.com | Firm (Hiring) |

## What If Something Fails?

| Issue | Fix |
|-------|-----|
| Blank page | Check Vite dev server overlay for errors |
| "Failed to fetch" | Supabase project may be paused — check https://supabase.com |
| Can't sign in | The seed script creates users on Supabase — run `node scripts/seed_demo_data.mjs` again |
| Port conflict | Main app = :3000, Admin = :3001 |
