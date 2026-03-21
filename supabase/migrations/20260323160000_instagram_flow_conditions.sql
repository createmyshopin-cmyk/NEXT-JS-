-- Optional denormalized snapshot of condition configs for analytics / quick display

ALTER TABLE instagram_automation_flows
  ADD COLUMN IF NOT EXISTS conditions_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN instagram_automation_flows.conditions_meta IS 'Summary of condition nodes (keyword/follower/schedule) for reporting; derived from flow_definition on save.';
