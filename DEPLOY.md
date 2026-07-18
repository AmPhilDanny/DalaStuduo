# Deploy Guide

## Architecture

| Part | Host | URL |
|------|------|-----|
| Skillbridge frontend | **Vercel** | `skillbridge-xxx.vercel.app` |
| Admin dashboard | **Vercel** | `admin-xxx.vercel.app` |
| Express API server | **Render** (keep) | `dalastudioshowcase.onrender.com` |
| Database | **Supabase** (already hosted) | — |

---

## Step 1 — Deploy frontends to Vercel

### Prerequisites
- Vercel CLI installed (`npm i -g vercel`)
- Logged in: `vercel login`

### Skillbridge (main B2B app)

```bash
cd Skillbridge
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** → `Y`
- **Which scope?** → Select your Vercel account
- **Link to existing project?** → `N` (create new)
- **Project name?** → `skillbridge` (or your choice)
- **Directory?** → `<just Enter>`
- **Override settings?** → `N`

Once deployed, set the env var in Vercel dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key  
   - `VITE_API_URL` = `https://dalastudioshowcase.onrender.com/api`
3. Go to **Deployments** → find the latest → **Redeploy**

### Admin dashboard

```bash
cd admin
vercel --prod
```

Same prompts, project name: `skillbridge-admin`

Set the same env vars plus:
- `VITE_MAIN_SITE_URL` = `https://skillbridge.vercel.app` (or whatever Vercel assigned)

---

## Step 2 — Verify SPA routing

After deployment:
- Visit `https://skillbridge.vercel.app/b2b/settings` directly in the browser
- Refresh the page — it should load the app, not 404
- Test a few deep links: `/b2b/team`, `/org/verification`, etc.

The `vercel.json` file in each frontend handles this:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Every unmatched URL serves `index.html`, React Router takes over client-side.

---

## Step 3 — API server stays on Render

The `render.yaml` has been cleaned up — only the Express API server remains on Render. Render will auto-deploy from `master`. No action needed.

CORS already allows `*.vercel.app` origins (added to `ALLOWED_ORIGINS` in `server/src/index.ts`).

---

## Step 4 — Optional: Custom domains

In Vercel dashboard → your project → **Domains**:
- Add `yourdomain.com` for the main frontend
- Add `admin.yourdomain.com` for the admin dashboard

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API calls fail with CORS | Check VITE_API_URL env var in Vercel dashboard matches the Render API URL |
| 404 on Vercel after deploy | Verify `vercel.json` exists in the frontend root and has the rewrite rule |
| Build fails on Vercel | Run `npm run build` locally to check for errors first |
| API endpoints return 404 | API routes exist at `/api/b2b/*`, `/api/admin/*` etc. — make sure the path starts with `/api` |
