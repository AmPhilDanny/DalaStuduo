# Render Deployment Guide — Dala / Skillbridge

## Project
**Render Project:** https://dashboard.render.com/project/prj-d9a0u3i8qa3s73d3vaig  
**GitHub Repo:** https://github.com/AmPhilDanny/DalaStuduo (branch: `master`)  
**render.yaml** at repo root defines all 3 services (Blueprint mode requires payment info, so add individually below).

---

## Step 1 — skillbridge-api (Express Server)

**Type:** Web Service  
**Dashboard:** New + → Web Service

| Field | Value |
|---|---|
| GitHub repo | `AmPhilDanny/DalaStuduo` |
| Branch | `master` |
| Name | `skillbridge-api` |
| Runtime | `Node` |
| Root Directory | `server` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Plan | Free |

### Environment Variables

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4001` |
| `SUPABASE_URL` | `https://krihvhyexqstphxqkljr.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyaWh2aHlleHFzdHBoeHFrbGpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzM3NTQ0MCwiZXhwIjoyMDk4OTUxNDQwfQ.Gy7y_f5oGpr2ciEwVPwCihA8RyHbz0U8wwjkqd4wncQ` |

**Empty — you must provide these:**
- `PAYSTACK_SECRET_KEY` — from https://dashboard.paystack.com/#/settings/developer
- `FLUTTERWAVE_SECRET_KEY` — from https://dashboard.flutterwave.com/dashboard/settings/apis

**Redis:** Local `REDIS_URL=redis://localhost:6379` won't work on Render. Options:
- Omit it entirely (skip BullMQ job queue — API still works)
- Create free Upstash Redis (https://upstash.com/, 50MB free, no card needed)

---

## Step 2 — skillbridge (Main Frontend)

**Type:** Static Site  
**Dashboard:** New + → Static Site

| Field | Value |
|---|---|
| GitHub repo | `AmPhilDanny/DalaStuduo` |
| Branch | `master` |
| Name | `skillbridge` |
| Root Directory | `Skillbridge` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Plan | Free |

### Environment Variables

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://krihvhyexqstphxqkljr.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyaWh2aHlleHFzdHBoeHFrbGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNzU0NDAsImV4cCI6MjA5ODk1MTQ0MH0.JawmNR0zHBWHT3K9KI7O6S1naJA0Q8R_njKiqDHB8Lo` |
| `VITE_API_URL` | `https://skillbridge-api.onrender.com/api` |

---

## Step 3 — skillbridge-admin (Admin Dashboard)

**Type:** Static Site  
**Dashboard:** New + → Static Site

| Field | Value |
|---|---|
| GitHub repo | `AmPhilDanny/DalaStuduo` |
| Branch | `master` |
| Name | `skillbridge-admin` |
| Root Directory | `admin` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Plan | Free |

### Environment Variables

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://krihvhyexqstphxqkljr.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyaWh2aHlleHFzdHBoeHFrbGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNzU0NDAsImV4cCI6MjA5ODk1MTQ0MH0.JawmNR0zHBWHT3K9KI7O6S1naJA0Q8R_njKiqDHB8Lo` |
| `VITE_API_URL` | `https://skillbridge-api.onrender.com/api` |

---

## Order

1. Create **skillbridge-api** first (wait for deploy to finish, copy its URL)
2. Create **skillbridge** and **skillbridge-admin** (can do both in parallel)
3. Set `VITE_API_URL` on both frontends to the live API URL from step 1

---

## Known Gaps / Next Debugging

| Issue | Status |
|---|---|
| `PAYSTACK_SECRET_KEY` missing | Needs value from Paystack dashboard |
| `FLUTTERWAVE_SECRET_KEY` missing | Needs value from Flutterwave dashboard |
| `REDIS_URL` points to localhost | Needs Upstash Redis or omit |
| Admin `src/lib/marketplace.ts` still has 20+ direct edge function `fetch()` calls | Needs migration to Express API client |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` missing | Needs GitHub OAuth app values |
