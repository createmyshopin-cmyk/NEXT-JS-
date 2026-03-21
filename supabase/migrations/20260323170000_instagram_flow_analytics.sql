-- Per-node flow execution events for heatmap / funnel analytics

CREATE TABLE IF NOT EXISTS instagram_flow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES instagram_automation_flows(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  passed boolean,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ife_tenant_created ON instagram_flow_executions (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ife_flow_created ON instagram_flow_executions (flow_id, created_at DESC);

COMMENT ON TABLE instagram_flow_executions IS 'Log of flow graph node visits during webhook evaluation.';

ALTER TABLE instagram_flow_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_read_own_executions" ON instagram_flow_executions;
CREATE POLICY "tenant_read_own_executions" ON instagram_flow_executions
  FOR SELECT USING (tenant_id = (SELECT get_my_tenant_id()));

DROP POLICY IF EXISTS "service_role_exec_all" ON instagram_flow_executions;
CREATE POLICY "service_role_exec_all" ON instagram_flow_executions
  FOR ALL USING (auth.role() = 'service_role');
