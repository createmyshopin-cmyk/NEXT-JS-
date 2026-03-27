-- Ensure exactly one site_settings row per tenant.
-- Includes one-time dedupe so index creation succeeds.

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id
      ORDER BY updated_at DESC, id DESC
    ) AS rn
  FROM public.site_settings
)
DELETE FROM public.site_settings s
USING ranked r
WHERE s.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS site_settings_tenant_id_unique_idx
ON public.site_settings (tenant_id);

