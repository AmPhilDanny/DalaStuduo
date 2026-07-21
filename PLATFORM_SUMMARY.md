# DalaStuduo Platform Summary

> **Three platforms powering the SkillBridge Africa ecosystem.**
> Last updated: 2026-07-22

---

## 1. Novaxbridge — Main Frontend (Public Platform)

**Stack**: React 19 + Vite + TypeScript + Tailwind CSS + Radix UI + Supabase  
**Port**: `:3000`  
**Deploy**: `dala-studuo.vercel.app`

### Core Features

#### 🔐 Authentication & Users
- Email/password auth via Supabase
- Role-based access: `user`, `tutor`, `admin`, `super_admin`, `firm`
- Profile management with avatar upload
- Connections/network (follow, connect)

#### 🏠 Home & Landing
- Dynamic hero section (configurable via admin)
- Programs showcase, mission section
- Configurable site-wide branding, meta tags, social links

#### 🛒 Marketplace
- Browse/search listings with categories
- Create marketplace listings (services, products)
- Order management with payment flow
- Dispute resolution system

#### 💼 Jobs Board
- Browse and search job listings
- Post jobs (firm role)
- Apply to jobs with application tracking

#### 🎨 Talent Discovery
- Talent directory with profiles
- Skill/project portfolio display
- Direct messaging

#### 📦 Projects
- Create and showcase projects
- Project collaboration tools
- Applications to join projects

#### 🎓 Academy (Skill Academy)
- **Course Catalog** (`/academy/browse`) — Browse, search, filter courses by category/level
- **Course Detail** (`/academy/:slug`) — Course info, curriculum, free/paid enrollment via marketplace orders
- **Learning Experience** (`/academy/learn/:courseId`) — Sidebar lesson navigation, video/text player, progress tracking, mark complete
- **My Courses** (`/academy/my-courses`) — Enrolled courses with active/completed tabs, progress bars
- **Course Builder** (`/academy/create`) — Module/lesson builder with drag-and-drop reorder, content types (video, text, live_session, quiz, assignment), pricing, categories
- **Tutor Applications** (`/academy/apply`) — Apply to become a tutor with headline, bio, expertise, rates
- **Tutor Dashboard** (`/tutor-dashboard`) — Stats, course list, per-course enrollment viewer
- **Certificates** — HTML certificate generation on course completion, stored in Supabase storage
- **Academy Dashboard** (`/academy`) — Overview with stats (courses, tutors, enrollments), featured courses, quick actions
- **Academy Subnav** — Sticky sub-navigation across all academy pages (Dashboard, Browse Courses, My Courses, AI Tutor, Tutor Dashboard, Become a Tutor, Create Course)

#### 🤖 AI Tutor
- **AI Tutor Sessions** (`/academy/ai-tutor`) — Create/manage tutoring sessions
- **Tutor Chat** (`/academy/ai-tutor/:id`) — Real-time AI-powered tutoring via OpenRouter/Mistral
- Knowledge base integration (add learning content as context)
- Quiz generation and grading
- Reflection/feedback on topics
- Integrated directly into course lessons ("Ask AI Tutor about this lesson")

#### 📹 Video Calls
- Jitsi-powered video rooms
- Room-based sessions (`/video-call/:roomId`)
- Used for live session course content

#### 💬 Messaging
- Direct user-to-user messaging
- Real-time via Socket.IO
- Notification bell with unread count

#### 👥 B2B Platform (Organization Features)
- **Org Setup** — Create and manage organizations
- **Org Verification** — Document verification workflow
- **Team Management** — Add/manage team members
- **Talent Pool** — Search and manage talent lists
- **Hiring Pipeline** — Post jobs, manage candidates, video interviews
- **Contracts** — Create and manage contracts
- **Meetings** — Schedule and join video meetings
- **Compliance Dashboard** — Track compliance status
- **Analytics Dashboard** — Org-wide metrics
- **Settings** — B2B plan management
- **B2B Subnav** — Sticky sub-navigation for all B2B pages

#### 💰 Wallet & Payments
- Wallet balance management
- Transaction history
- Order/payment tracking

### 🔮 Upcoming Features

#### 🔗 GitHub Integration
- OAuth-based GitHub account connection
- Encrypted token storage in `github_connections` table
- **Backend**: Server routes exist at `/api/github/*` (OAuth URL, connect, token, connection, disconnect)
- **Frontend**: Needs UI for connect/disconnect flow (button on profile/settings, OAuth redirect handler)

#### 💻 Online VSCode Editor
- In-browser code editor integrated into the Academy
- Students can write and run code directly in course lessons
- Proposed integration: CodePen/CodeSandbox embed for lightweight editing, or self-hosted code-server for full VSCode experience
- Use cases: coding exercises, project work, collaborative editing

---

## 2. admin_Novaxbridge — Admin Panel

**Stack**: React 19 + Vite + TypeScript + Tailwind CSS + Radix UI  
**Port**: `:4000`  
**Deploy**: Vercel (separate deployment)

### Dashboard Tabs & Features

#### 📊 Overview
- Platform-wide stats and metrics
- Quick access to all management sections

#### 🎓 Academy Management
- **Academy Settings** — Master toggle, tutor applications toggle, auto-approve tutors, minimum course price, platform fee percentage
- **Tutor Applications** — Review pending applications (approve/reject with notes), view applicant profiles

#### 🤖 AI Configuration
- Configure AI provider API keys (OpenRouter, OpenAI, etc.)
- Per-provider model selection
- Test connection for each provider

#### 💳 Manual Payments
- Manual payment verification queue
- Approve/reject manual payment submissions

#### 💼 B2B Billing
- Manage B2B subscription plans
- Payment tracking and management

#### ⚙️ Site Configuration
- Full site config editor (branding, hero, nav, footer, social, meta)
- JSON-based configuration merged with defaults

#### 🔄 Pull Requests
- View and manage PRs (if connected to GitHub)

---

## 3. server — Backend API

**Stack**: Express + TypeScript + Supabase + Redis + Socket.IO + Zod  
**Port**: `:4001` (dev), Render (production)  
**Deploy**: `dalastudioshowcase.onrender.com`

### API Routes

| Route Group | Base Path | Purpose |
|-------------|-----------|---------|
| **Academy** | `/api/academy/` | Courses CRUD, publish/unpublish, enrollments, certificates, tutor applications |
| **Admin** | `/api/admin/` | Site configuration CRUD |
| **AI** | `/api/ai/` | AI provider key management, model config |
| **B2B** | `/api/b2b/` | Organizations, team, talent, hiring, contracts, meetings, compliance, analytics |
| **Email** | `/api/email/` | Email sending |
| **GitHub** | `/api/github/` | GitHub OAuth flow, token encryption, connection management — *backend ready, needs frontend UI* |
| **Jobs** | `/api/jobs/` | Jobs CRUD, applications |
| **Marketplace** | `/api/marketplace/` | Listings CRUD, orders, order management |
| **Messaging** | `/api/messaging/` | Conversations, messages (real-time via Socket.IO) |
| **Notifications** | `/api/notifications/` | Notification CRUD, read/unread |
| **Payments** | `/api/payments/` | Payment processing (Flutterwave/Paystack via iceberg-js) |
| **Projects** | `/api/projects/` | Projects CRUD, collaboration |
| **Video Call** | `/api/video-call/` | Video room management |
| **Wallet** | `/api/wallet/` | Wallet balance, transactions |
| **Webhooks** | `/api/webhooks/` | External service webhooks |

### Infrastructure

| Service | Technology | Purpose |
|---------|-----------|---------|
| Database | Supabase (PostgreSQL) | Primary data store |
| Auth | Supabase Auth | User authentication + RLS |
| Real-time | Socket.IO | Live messaging, notifications |
| Job Queue | BullMQ + Redis | Background job processing |
| File Upload | Multer | File upload handling |
| Validation | Zod | Request/response validation |
| Logging | Pino | Structured logging |
| Security | Helmet | HTTP headers security |
| AI | OpenRouter/Mistral | AI tutor backend |
| Video | Jitsi | Video call infrastructure |
| Payments | iceberg-js | Payment gateway abstraction |

### Database Tables (Key)
- `profiles`, `site_settings`, `courses`, `course_modules`, `course_lessons`, `enrollments`, `tutor_applications`, `tutor_sessions`, `academy_config`, `certificates`
- `marketplace_listings`, `orders`, `order_items`
- `jobs`, `job_applications`
- `projects`, `project_collaborators`
- `messages`, `conversations`
- `notifications`
- `wallet_transactions`
- `github_connections` — *encrypted GitHub tokens*
- `organizations`, `org_teams`, `org_verifications`
- `subscription_plans`, `billing_payments`
- `meetings`, `contracts`, `compliance_records`

---

## Platform Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Users / Visitors                       │
└──────────┬──────────────┬──────────────────┬───────────┘
           │              │                  │
     ┌─────▼──────┐ ┌────▼───────┐   ┌──────▼──────┐
     │  Novaxbridge│ │  admin_    │   │  External   │
     │  (Port 3000)│ │  Novaxbridge│  │  Services   │
     │  Frontend  │ │  (Port 4000)│   │  (Jitsi,    │
     │  Vercel    │ │  Admin      │   │   OpenRouter,│
     └─────┬──────┘ └────┬───────┘   │   Supabase) │
           │              │          └─────────────┘
           └──────┬───────┘
                  │
          ┌───────▼────────┐
          │    server       │
          │  Express API    │
          │  Render/Railway │
          │                 │
          │  ┌───────────┐  │
          │  │  Redis     │  │
          │  │  (BullMQ)  │  │
          │  └───────────┘  │
          │  ┌───────────┐  │
          │  │ Supabase   │  │
          │  │ (Postgres) │  │
          │  └───────────┘  │
          └─────────────────┘
```

---

## Visitor Access Policy

| Feature | Visitor (not logged in) | Authenticated User |
|---------|------------------------|-------------------|
| Home, Marketplace, Talent, Jobs, Projects | ✅ Browse only | ✅ Full access |
| Academy Dashboard | ✅ See stats + courses + sign-in prompt | ✅ Full dashboard |
| Browse Courses | ✅ Browse/search | ✅ Browse + enroll |
| Course Detail | ✅ View details (enroll → sign-in) | ✅ Enroll + learn |
| AI Tutor | ❌ "Sign in to start" prompt | ✅ Full access |
| My Courses | ❌ Redirect to sign-in | ✅ Full access |
| Create Course | ❌ Not accessible | ✅ (tutor/admin) |
| Apply as Tutor | ✅ View form (submit → sign-in) | ✅ Full access |
| Profile/Messages/Wallet/Orders | ❌ Sign-in required | ✅ Full access |
| B2B Features | ❌ Sign-in required | ✅ (firm role) |
