-- ============================================================
-- GitHub OAuth — store encrypted tokens and user repo metadata
-- ============================================================

-- Encrypted extension for token storage
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- GitHub connections: stores OAuth token (encrypted) per user
CREATE TABLE IF NOT EXISTS github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  github_id BIGINT NOT NULL,
  github_login TEXT NOT NULL,
  github_avatar_url TEXT,
  github_url TEXT,
  access_token TEXT NOT NULL,  -- encrypted via pgcrypto
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;

-- Owner-only access
CREATE POLICY "github_connections_owner_select"
  ON github_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "github_connections_owner_insert"
  ON github_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "github_connections_owner_update"
  ON github_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "github_connections_owner_delete"
  ON github_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Cached repo metadata (no code stored)
CREATE TABLE IF NOT EXISTS user_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  github_repo_id BIGINT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_full_name TEXT NOT NULL,
  description TEXT,
  html_url TEXT NOT NULL,
  language TEXT,
  stars INT DEFAULT 0,
  forks INT DEFAULT 0,
  topics TEXT[],
  is_featured BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, github_repo_id)
);

ALTER TABLE user_repos ENABLE ROW LEVEL SECURITY;

-- Anyone can read repo metadata
CREATE POLICY "user_repos_public_select"
  ON user_repos FOR SELECT
  USING (true);

-- Owner can insert/update/delete
CREATE POLICY "user_repos_owner_insert"
  ON user_repos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_repos_owner_update"
  ON user_repos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "user_repos_owner_delete"
  ON user_repos FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_github_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_github_connections_updated_at
  BEFORE UPDATE ON github_connections
  FOR EACH ROW EXECUTE FUNCTION update_github_updated_at();
