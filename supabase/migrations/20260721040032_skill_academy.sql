-- ════════════════════════════════════════════════════════
-- Digital Skill Academy — new tables & RLS
-- ════════════════════════════════════════════════════════

-- ── Tutor applications ──────────────────────────────────────────
CREATE TABLE public.tutor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  headline TEXT NOT NULL,
  bio TEXT NOT NULL,
  credentials TEXT,
  sample_lesson_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Courses ──────────────────────────────────────────────────────
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced')),
  cover_image_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  format TEXT NOT NULL DEFAULT 'self_paced' CHECK (format IN ('self_paced','live','hybrid')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','published','archived')),
  listing_id UUID REFERENCES public.marketplace_listings(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Modules & Lessons ────────────────────────────────────────────
CREATE TABLE public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video','text','live_session','quiz','assignment')),
  content_url TEXT,
  content_body TEXT,
  live_session_slot_id UUID REFERENCES public.provider_availability_slots(id),
  duration_minutes INT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Enrollment & progress ───────────────────────────────────────
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','dropped')),
  progress_percent INT NOT NULL DEFAULT 0,
  certificate_issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);

CREATE TABLE public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, lesson_id)
);

-- ── Link AI tutor sessions to a course (nullable = still freeform) ──
ALTER TABLE public.tutor_sessions ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id);
ALTER TABLE public.tutor_sessions ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES public.lessons(id);

-- ── RLS ─────────────────────────────────────────────────────────
ALTER TABLE public.tutor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;

-- Tutor applications: users manage own, admins read all
CREATE POLICY "Users manage own tutor application" ON public.tutor_applications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all applications" ON public.tutor_applications
  FOR SELECT USING (true);

-- Courses: published = public, tutors manage own
CREATE POLICY "Published courses are public" ON public.courses
  FOR SELECT USING (status = 'published' OR tutor_id = auth.uid());

CREATE POLICY "Tutors manage own courses" ON public.courses
  FOR ALL USING (tutor_id = auth.uid()) WITH CHECK (tutor_id = auth.uid());

-- Course modules: visible if course is visible
CREATE POLICY "Modules visible with course" ON public.course_modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.status = 'published' OR c.tutor_id = auth.uid()))
  );

CREATE POLICY "Tutors manage own modules" ON public.course_modules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid())
  );

-- Lessons: visible if course is visible
CREATE POLICY "Lessons visible with course" ON public.lessons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = module_id AND (c.status = 'published' OR c.tutor_id = auth.uid()))
  );

CREATE POLICY "Tutors manage own lessons" ON public.lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = module_id AND c.tutor_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.course_modules m JOIN public.courses c ON c.id = m.course_id WHERE m.id = module_id AND c.tutor_id = auth.uid())
  );

-- Enrollments: students manage own, tutors view their course enrollments
CREATE POLICY "Students manage own enrollment" ON public.enrollments
  FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "Tutors view enrollments in their courses" ON public.enrollments
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.tutor_id = auth.uid()));

-- Lesson completions: students manage own
CREATE POLICY "Students manage own completions" ON public.lesson_completions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.student_id = auth.uid()));

CREATE POLICY "Tutors view completions" ON public.lesson_completions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.enrollments e JOIN public.courses c ON c.id = e.course_id WHERE e.id = enrollment_id AND c.tutor_id = auth.uid()));
