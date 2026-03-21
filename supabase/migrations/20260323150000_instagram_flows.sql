-- Instagram automation visual flows (React Flow graph JSON)

CREATE TABLE IF NOT EXISTS instagram_automation_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default',
  channel text NOT NULL DEFAULT 'dm' CHECK (channel IN ('dm', 'comment', 'story', 'all')),
  flow_definition jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  is_draft boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_iaf_tenant_enabled ON instagram_automation_flows (tenant_id, enabled);

COMMENT ON TABLE instagram_automation_flows IS 'Per-tenant visual automation flows (nodes/edges JSON for @xyflow/react).';

ALTER TABLE instagram_automation_flows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_manage_own" ON instagram_automation_flows;
CREATE POLICY "tenant_manage_own" ON instagram_automation_flows
  FOR ALL USING (tenant_id = (SELECT get_my_tenant_id()));

DROP POLICY IF EXISTS "service_role_all" ON instagram_automation_flows;
CREATE POLICY "service_role_all" ON instagram_automation_flows
  FOR ALL USING (auth.role() = 'service_role');

ALTER PUBLICATION supabase_realtime ADD TABLE instagram_automation_flows;
