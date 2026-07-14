CREATE TABLE IF NOT EXISTS project_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_project_invite UNIQUE (project_id, recipient_id)
);

CREATE TABLE IF NOT EXISTS project_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_project_join_request UNIQUE (project_id, requester_id)
);

CREATE TABLE IF NOT EXISTS project_collaboration_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcm_project_created
  ON project_collaboration_messages (project_id, created_at ASC);

ALTER TABLE project_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaboration_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY pi_select_own ON project_invites
  FOR SELECT USING (recipient_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY pi_insert_owner ON project_invites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  );

CREATE POLICY pjr_select_own ON project_join_requests
  FOR SELECT USING (
    requester_id = auth.uid() OR
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  );

CREATE POLICY pjr_insert_auth ON project_join_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY pcm_select_member ON project_collaboration_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = project_collaboration_messages.project_id AND member_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM projects WHERE id = project_collaboration_messages.project_id AND owner_id = auth.uid())
  );

CREATE POLICY pcm_insert_member ON project_collaboration_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND (
      EXISTS (SELECT 1 FROM project_members WHERE project_id = project_collaboration_messages.project_id AND member_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM projects WHERE id = project_collaboration_messages.project_id AND owner_id = auth.uid())
    )
  );
