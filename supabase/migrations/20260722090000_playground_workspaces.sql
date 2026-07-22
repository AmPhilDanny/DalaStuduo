-- ════════════════════════════════════════════════════════
-- Academy Playground — GitHub-backed coding workspaces
-- ════════════════════════════════════════════════════════

CREATE TABLE public.playground_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  github_repo_name TEXT NOT NULL,
  github_repo_url TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id),
  lesson_id UUID REFERENCES public.lessons(id),
  last_opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── RLS ─────────────────────────────────────────────────
ALTER TABLE public.playground_workspaces ENABLE ROW LEVEL SECURITY;

-- Users manage their own workspaces
CREATE POLICY "Users manage own playground workspaces" ON public.playground_workspaces
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin can read all (for support)
CREATE POLICY "Admins read all workspaces" ON public.playground_workspaces
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
