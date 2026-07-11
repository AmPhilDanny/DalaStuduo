# Prompt: Premium Talent Pool Search

> **Target:** `src/b2b/pages/B2BTalentPool.tsx` + edge function endpoint
> **When to use:** Sprint 2
> **Agent role:** Full-Stack Engineer

---

## Prompt

```
TASK: Build the premium talent pool search feature for B2B orgs.

EXPECTED OUTCOME: A powerful talent search page with advanced filtering, AI-powered natural language search, saved talent lists, and premium gating.

REQUIRED TOOLS: Read (existing profile/talent pages), Write (new page + API)

MUST DO:

1. Create edge function endpoint GET /b2b/talent/search in b2b-api:
   - Query profiles table with role in ('student', 'provider', 'buyer')
   - Filters: skills (array overlap), location (ILIKE), availability, min_rating, price_range
   - Search: ILIKE on full_name, headline, bio
   - AI search: if query param `ai=true`, use ai-assist to parse natural language into structured filters
   - Pagination with limit/offset
   - Rate limit free tier to 10 searches/day
   - Return profiles with: id, full_name, avatar_url, headline, bio, skills, availability, location, average_rating

2. Create `src/b2b/components/talent/TalentSearch.tsx`:
   - Search input with magnifying glass icon
   - Advanced filters panel (collapsible): skills multi-select, location, availability dropdown, rating slider
   - AI toggle: "AI Search" button that enables natural language querying
   - Search results as cards: avatar, name, headline, skills badges, rating stars, availability indicator
   - Each card has: "View Profile", "Save to List", "Message", "Hire" buttons (gated by subscription)
   - Pagination at bottom

3. Create `src/b2b/components/talent/SavedTalentList.tsx`:
   - Tab switcher: Search | Saved Lists
   - Create named lists: "Frontend Candidates", "Shortlist Q3"
   - Each list shows saved talents with a note field
   - Remove from list, export to CSV

4. Create save/list endpoints if not already in b2b-api:
   - GET /b2b/talent/saved-lists
   - POST /b2b/talent/saved-lists (create list)
   - POST /b2b/talent/saved-lists/:id/talent (add talent)
   - DELETE /b2b/talent/saved-lists/:id/talent/:profileId

5. Premium gating:
   - Free tier: basic keyword search, 5 results, no AI
   - Starter: advanced filters, 50 results, no AI
   - Professional: everything + AI search + unlimited results + export
   - Enterprise: everything + API access

6. AI-powered natural language search:
   - User types: "Find me senior React developers in Lagos available for contract work"
   - Call ai-assist with admin_metric_insight mode or dedicated prompt
   - Parse response into structured filters
   - Apply filters and return results
   - Show "AI matched" badge on results

MUST NOT DO:
- Don't expose email addresses in search results
- Don't allow searching without org membership
- Don't bypass subscription gating on the server side
- Don't show inactive profiles

CONTEXT:
- Profiles are in public.profiles table with: id, full_name, avatar_url, headline, bio, skills (text[]), availability, location, role, created_at
- Existing Talent page at `src/pages/Talent.tsx` shows public talent directory — read for reference
- ai-assist edge function exists at supabase/functions/ai-assist/index.ts
- Skills are stored as PostgreSQL text array (text[])
- Availability values: open_to_work, open_to_collab, not_available
```

---

## Verification Checklist
- [ ] Search returns filtered results correctly
- [ ] Filters combine properly (AND logic)
- [ ] Pagination works with large result sets
- [ ] AI search parses natural language correctly
- [ ] Subscription gating enforced server-side
- [ ] Saved lists persist and are org-scoped
- [ ] Export produces valid CSV
- [ ] Free tier limits enforced
