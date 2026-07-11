# Prompt: B2B Analytics & AI Insights

> **Target:** `src/b2b/pages/B2BAnalytics.tsx` + edge function endpoints
> **When to use:** Sprint 3
> **Agent role:** Data Engineer + Frontend Engineer

---

## Prompt

```
TASK: Build the B2B analytics dashboard with AI-powered insights.

EXPECTED OUTCOME: A comprehensive analytics page showing hiring metrics, spend reports, and talent ROI with AI-generated commentary.

REQUIRED TOOLS: Read (existing order/job tables), Write (new page + API)

MUST DO:

1. Create edge function endpoints GET /b2b/analytics/* in b2b-api:

   GET /b2b/analytics/hiring?org_id=X&from=DATE&to=DATE
   - Total applications (by job, by status)
   - Time-to-hire average (from application to accepted)
   - Offer acceptance rate
   - Applications by source (if tracked)
   - Hiring funnel: new → reviewed → interviewed → offer → hired → rejected counts
   - Response: { data: { funnel, time_to_hire, acceptance_rate, applications_by_job, trends } }

   GET /b2b/analytics/spend?org_id=X&from=DATE&to=DATE
   - Total spend (sum of order amounts + contract amounts)
   - Spend by category (by service type, by talent)
   - Monthly spend trend (last 12 months)
   - Average cost-per-hire
   - Budget vs actual
   - Response: { data: { total, by_category, by_month, cost_per_hire, trends } }

   GET /b2b/analytics/talent?org_id=X
   - Hired talent count
   - Average talent rating
   - Talent retention (repeat hires)
   - Top skills hired
   - Response: { data: { total_hired, avg_rating, retention_rate, top_skills } }

2. Create AI Insight generation:
   - After fetching analytics, call ai-assist with admin_metric_insight mode
   - Pass metrics summary as parameters
   - Display AI-generated insight cards on the page
   - Cache AI responses to avoid repeated calls

3. Create `src/b2b/components/analytics/HiringMetrics.tsx`:
   - Funnel visualization (horizontal bar chart or step chart)
   - Use CSS-only charts (no external chart library — use Tailwind bar charts)
   - Key metric cards with colored indicators
   - AI Insight card below

4. Create `src/b2b/components/analytics/SpendReport.tsx`:
   - Monthly spend bar chart (CSS bars)
   - Spend breakdown by category (pie chart via CSS conic-gradient)
   - Cost-per-hire metric with trend arrow (up/down/flat)
   - Export to CSV button

5. Create `src/b2b/components/analytics/TalentROI.tsx`:
   - Hired talent stats
   - Top skills hired (tag cloud)
   - Repeat hire rate
   - Average rating trend

6. Create `src/b2b/pages/B2BAnalytics.tsx`:
   - Tab sub-navigation: Hiring Funnel | Spend | Talent ROI | AI Overview
   - Date range picker (presets: 7d, 30d, 90d, 1y, custom)
   - Export all button
   - Loading skeleton states
   - Responsive grid layout

MUST NOT DO:
- Don't add external chart libraries — use CSS-only charts
- Don't expose sensitive financial data to non-admin roles
- Don't cache sensitive data in localStorage
- Don't make excessive AI API calls (cache results)
- Don't show empty charts gracefully

CONTEXT:
- Data comes from: orders, jobs, applications, marketplace_listings tables
- Org ID is available from useOrg hook
- ai-assist function supports admin_metric_insight mode
- Charts should be pure CSS/Tailwind: bar charts via div heights, pie charts via conic-gradient
- See existing pattern at src/pages/OrgDashboard.tsx for stat cards
```

---

## Verification Checklist
- [ ] Analytics load with real org data
- [ ] Date range filtering works
- [ ] Charts render without external libraries
- [ ] AI insights display and are relevant
- [ ] Role-based access enforced (viewer can see, admin can export)
- [ ] CSV export works for all report types
- [ ] Responsive on mobile
- [ ] No TypeScript errors
