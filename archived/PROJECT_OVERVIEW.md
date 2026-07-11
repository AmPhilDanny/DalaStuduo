# Project Documentation: SkillBridge Africa

This document provides a comprehensive overview of the SkillBridge Africa project, including its purpose, technical architecture, and implementation plan.

## 1. Project Overview
SkillBridge Africa is a premium tech-skill bridging platform designed to connect African students with industry opportunities. It serves as a marketplace where students can find part-time work, internships, and mentorship, while firms can discover and hire emerging talent.

### Core Value Proposition
- **For Students:** Access to real-world work experience, industry mentorship, and a platform to build a professional portfolio.
- **For Firms:** Direct access to a vetted pool of motivated tech talent and a streamlined process for posting jobs and internships.

---

## 2. Functional Requirements

### User Roles
- **Student:** Can create profiles, browse job/internship listings, and apply for opportunities.
- **Firm (Employer):** Can create company profiles, post job/internship listings, and manage applicants.

### Key Features
1. **Authentication & Profiles:** Secure login/signup with role selection (Student vs. Firm). Automatic profile creation on signup.
2. **Job Marketplace:**
   - **Listings:** A centralized board for "Part-time Works" and "Internships".
   - **Posting:** Firms can create, edit, and delete their listings.
   - **Applications:** Students can submit applications for specific roles.
3. **Responsive Design:** A professional, mobile-first UI using a "Deep Navy" (#0A192F) and "Accent Gold" (#F59E0B) aesthetic.
4. **Security:** Role-Based Access Control (RBAC) enforced via Supabase Row Level Security (RLS).

---

## 3. Technical Architecture

### Frontend
- **Framework:** React with Vite
- **Styling:** Tailwind CSS (v4)
- **UI Components:** Shadcn UI (Radix UI primitives)
- **Routing:** React Router DOM
- **Icons:** Lucide React
- **State Management:** React Context (for Auth)

### Backend (BaaS)
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Middleware:** Row Level Security (RLS) for data protection
- **Client:** `@supabase/supabase-js`

### Database Schema
- **`profiles`:** Stores user-specific data (name, role, avatar) linked to `auth.users`.
- **`jobs`:** Stores listings (title, description, type, firm_id).
- **`applications`:** Tracks student applications to specific jobs.

---

## 4. Implementation Plan (Current Roadmap)

### Phase 1: Foundation (Completed)
- Initialize React/Vite project with Tailwind CSS.
- Design and implement the landing page (Hero, Mission, Stats, Mentorship sections).
- Set up Supabase project and database connection.

### Phase 2: Marketplace Logic (Completed)
- Generate SQL migrations for `profiles`, `jobs`, and `applications` tables.
- Implement RLS policies to ensure data privacy.
- Build the `/auth` page for user onboarding.
- Create the `/jobs` marketplace page with filtering and application logic.

### Phase 3: Advanced Features (Planned)
- **Vendor/Service Provider System:** Allowing students to offer specific services (Web Dev, UI/UX) directly.
- **Project Portfolio System:** A dedicated space for students to showcase GitHub links and case studies.
- **Collaboration Hub:** Tools for team formation and project management.
- **Messaging:** In-app communication between firms and students.

---

## 5. File Structure Highlights
- `src/pages/`: Contains main view components (`Home.tsx`, `Auth.tsx`, `Jobs.tsx`).
- `src/components/`: Modular UI components organized by feature (home, layout, ui).
- `src/hooks/`: Custom hooks like `useAuth.tsx` for managing user sessions.
- `src/integrations/supabase/`: Supabase client configuration and auto-generated types.
- `supabase/migrations/`: SQL files defining the database schema and security rules.

---

## 6. How the Project Should Function

### Student Journey
1. **Landing Page** → User visits the homepage and sees SkillBridge Africa's value proposition, programs, mentorship info, and testimonials.
2. **Registration** → User clicks "Get Started" or navigates to `/auth`, selects "Student" role, and creates an account.
3. **Profile Creation** → On signup, a profile is automatically created in the `profiles` table.
4. **Browse Jobs** → Student navigates to `/jobs` to see all available part-time works and internships.
5. **Apply** → Student clicks "Apply" on a job listing, submitting an application that is stored in the `applications` table.
6. **Track Applications** → Student can view their application history and status.

### Firm/Employer Journey
1. **Landing Page** → Firm visits the homepage and learns about the talent pool.
2. **Registration** → Firm navigates to `/auth`, selects "Firm" role, and creates an account.
3. **Profile Creation** → On signup, a firm profile is automatically created.
4. **Post Jobs** → Firm can create new job/internship listings with title, description, type, and requirements.
5. **Manage Listings** → Firm can edit or remove their posted jobs.
6. **Review Applications** → Firm can view all applications received for their listings and manage the hiring pipeline.

### Data Flow
```
User → React Frontend → Supabase Client → PostgreSQL Database
                ↑                                    ↓
           Auth Context ←──── Supabase Auth ←── RLS Policies
```

### Security Model
- All tables have Row Level Security (RLS) enabled.
- `profiles`: Users can read all profiles but only update their own.
- `jobs`: Anyone can read jobs. Only authenticated firms can create/update/delete their own jobs.
- `applications`: Students can create and read their own applications. Firms can read applications for their own jobs.

---

## 7. Planned Feature Roadmap

### Near-Term (Phase 3)
| Feature | Description | Priority |
|---------|-------------|----------|
| Vendor System | Students offer services (web dev, design, etc.) | High |
| Portfolio System | Showcase projects with GitHub links & case studies | High |
| Skill Assessment | Quizzes and certifications for skill verification | Medium |

### Mid-Term (Phase 4)
| Feature | Description | Priority |
|---------|-------------|----------|
| Collaboration Hub | Team formation, Kanban boards, code reviews | Medium |
| Learning Resources | Curated learning paths and tutorials | Medium |
| Events & Workshops | Tech meetups, hackathons, webinars | Medium |

### Long-Term (Phase 5)
| Feature | Description | Priority |
|---------|-------------|----------|
| Messaging System | In-app communication between students and firms | High |
| Analytics Dashboard | Application tracking, success metrics | Low |
| Firm Portal | Enhanced company profiles, campus ambassador programs | Low |
| Notification System | Email, in-app, and SMS notifications | Medium |

---

## 8. Design System

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| Primary (Deep Navy) | `#0A192F` | Headers, primary buttons, navigation |
| Secondary (Accent Gold) | `#F59E0B` | CTAs, highlights, badges |
| Accent (Professional Blue) | `#1B4D89` | Links, secondary elements |
| Background | `#FFFFFF` | Page background |
| Foreground | `#0A0A0A` | Body text |

### Typography
- **Sans-serif:** System UI font stack (default)
- **Serif:** Georgia, Cambria (for editorial content)
- **Mono:** SFMono-Regular, Menlo (for code snippets)

### Component Library
Built on Shadcn UI with Radix UI primitives, providing accessible, composable components including:
- Buttons, Cards, Dialogs, Forms
- Navigation (Navbar, Breadcrumbs, Tabs)
- Data Display (Tables, Charts, Badges)
- Feedback (Toasts via Sonner, Alerts)

---

## 9. Development Setup

### Prerequisites
- Node.js 18+
- Bun (package manager)
- Supabase project with database connected

### Commands
```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Type checking
bun run typecheck

# Linting
bun run lint
```

### Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key

---

*Last Updated: Project documentation compiled from implementation history and planning sessions.*
