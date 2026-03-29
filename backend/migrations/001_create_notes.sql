-- =============================================================
-- Migration 001 — Create notes table
-- PinNest | Supabase PostgreSQL
-- =============================================================

CREATE TABLE IF NOT EXISTS notes (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title        TEXT        NOT NULL,
  description  TEXT,
  priority     TEXT        CHECK (priority IN ('high', 'medium', 'low')) NOT NULL DEFAULT 'medium',
  color        TEXT        NOT NULL DEFAULT 'neutral',
  deadline     TIMESTAMPTZ,
  is_completed BOOLEAN     DEFAULT FALSE,
  position_x   INTEGER     DEFAULT 0,
  position_y   INTEGER     DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for fast per-user queries (used by every getNotes call)
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes (user_id);

-- Index to speed up the analytics filter on is_completed
CREATE INDEX IF NOT EXISTS notes_user_completed_idx ON notes (user_id, is_completed);

-- =============================================================
-- Sample seed data — 5 test notes (replace user_id with a real UUID)
-- =============================================================
-- INSERT INTO notes (user_id, title, description, priority, color, deadline) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'Launch PinNest MVP',          'Submit to Play Store',           'high',   'yellow', NOW() + INTERVAL '14 days'),
--   ('00000000-0000-0000-0000-000000000001', 'Read 12 books this year',     'One book per month',             'medium', 'green',  NOW() + INTERVAL '30 days'),
--   ('00000000-0000-0000-0000-000000000001', 'Morning workout habit',       '5 days a week',                  'low',    'blue',   NULL),
--   ('00000000-0000-0000-0000-000000000001', 'Learn Spanish — A2 level',    'Duolingo + weekly class',        'medium', 'neutral',NOW() + INTERVAL '90 days'),
--   ('00000000-0000-0000-0000-000000000001', 'Save ₹50,000 emergency fund', 'Transfer ₹5k every pay cycle',   'high',   'yellow', NOW() + INTERVAL '60 days');
