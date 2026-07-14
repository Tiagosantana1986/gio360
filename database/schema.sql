-- Execute no SQL Editor do Neon somente apos revisar a pull request.
CREATE TABLE IF NOT EXISTS gie360_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gie360_workspace_state (
  workspace_id UUID PRIMARY KEY REFERENCES gie360_workspaces(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  version BIGINT NOT NULL DEFAULT 1,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gie360_workspace_state_updated_at_idx
  ON gie360_workspace_state (updated_at DESC);
