-- Align instagram_flow_executions with plan (event_type, sender_ig_id, result)

ALTER TABLE instagram_flow_executions
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS sender_ig_id text,
  ADD COLUMN IF NOT EXISTS result text;

COMMENT ON COLUMN instagram_flow_executions.event_type IS 'e.g. node_visit';
COMMENT ON COLUMN instagram_flow_executions.sender_ig_id IS 'IG user id when evaluation is for DM/comment';
COMMENT ON COLUMN instagram_flow_executions.result IS 'Human-readable outcome (pass/fail/action)';
