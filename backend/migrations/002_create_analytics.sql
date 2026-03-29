-- =============================================================
-- Migration 002 — Create analytics_events table + consistency score function
-- PinNest | Supabase PostgreSQL
-- =============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note_id    UUID        REFERENCES notes(id) ON DELETE SET NULL,
  event_type TEXT        NOT NULL,
  -- Allowed event_type values:
  --   'note_created'   | 'note_completed'  | 'note_viewed'
  --   'deadline_met'   | 'deadline_missed' | 'streak_day'
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast per-user event queries
CREATE INDEX IF NOT EXISTS analytics_user_idx ON analytics_events (user_id);

-- Index for time-range queries used by streak, heatmap, weekly completions
CREATE INDEX IF NOT EXISTS analytics_user_time_idx ON analytics_events (user_id, created_at DESC);

-- Index for filtering by event_type (used in streak and deadline queries)
CREATE INDEX IF NOT EXISTS analytics_user_type_idx ON analytics_events (user_id, event_type);

-- =============================================================
-- Postgres function: compute_consistency_score(p_user_id uuid)
-- Returns a score 0-100 based on:
--   streak_component     = min(current_streak / 30, 1) * 40
--   completion_component = (completed_notes / total_notes) * 40
--   deadline_component   = (deadlines_met / deadlines_set) * 20
-- =============================================================
CREATE OR REPLACE FUNCTION compute_consistency_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_notes      INTEGER;
  v_completed_notes  INTEGER;
  v_deadlines_set    INTEGER;
  v_deadlines_met    INTEGER;
  v_streak           INTEGER := 0;
  v_cursor_date      DATE    := CURRENT_DATE;
  v_streak_component NUMERIC;
  v_comp_component   NUMERIC;
  v_deadline_comp    NUMERIC;
  v_score            INTEGER;
BEGIN
  -- Note counts
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed)
  INTO v_total_notes, v_completed_notes
  FROM notes
  WHERE user_id = p_user_id;

  -- Deadline counts
  SELECT COUNT(*) FILTER (WHERE deadline IS NOT NULL)
  INTO v_deadlines_set
  FROM notes
  WHERE user_id = p_user_id;

  SELECT COUNT(*)
  INTO v_deadlines_met
  FROM analytics_events
  WHERE user_id = p_user_id AND event_type = 'deadline_met';

  -- Streak: count consecutive days with activity going backwards from today
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM analytics_events
      WHERE user_id = p_user_id
        AND event_type IN ('note_completed', 'note_viewed', 'streak_day')
        AND created_at::DATE = v_cursor_date
    );
    v_streak      := v_streak + 1;
    v_cursor_date := v_cursor_date - INTERVAL '1 day';
  END LOOP;

  -- Score components
  v_streak_component := LEAST(v_streak::NUMERIC / 30, 1) * 40;
  v_comp_component   := CASE WHEN v_total_notes = 0 THEN 0
                             ELSE (v_completed_notes::NUMERIC / v_total_notes) * 40 END;
  v_deadline_comp    := CASE WHEN v_deadlines_set = 0 THEN 0
                             ELSE (v_deadlines_met::NUMERIC / v_deadlines_set) * 20 END;

  v_score := ROUND(v_streak_component + v_comp_component + v_deadline_comp);
  RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$;
