-- =============================================================
-- Migration 003 — Row Level Security (RLS) policies
-- PinNest | Supabase PostgreSQL
-- Run AFTER 001 and 002
-- =============================================================

-- Enable RLS on both tables
ALTER TABLE notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events  ENABLE ROW LEVEL SECURITY;

-- ── notes policies ────────────────────────────────────────────

-- SELECT: users can only read their own notes
CREATE POLICY notes_select ON notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: users can only insert rows where user_id matches their uid
CREATE POLICY notes_insert ON notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own notes
CREATE POLICY notes_update ON notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: users can only delete their own notes
CREATE POLICY notes_delete ON notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ── analytics_events policies ─────────────────────────────────

-- SELECT: users can only read their own events
CREATE POLICY events_select ON analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: users can only insert their own events
CREATE POLICY events_insert ON analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own events
CREATE POLICY events_update ON analytics_events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: users can only delete their own events
CREATE POLICY events_delete ON analytics_events
  FOR DELETE
  USING (auth.uid() = user_id);
