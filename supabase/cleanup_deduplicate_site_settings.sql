-- =============================================================================
-- SAFE CLEANUP: Deduplicate public.site_settings per tenant_id
-- =============================================================================
-- What this does:
--   1) Shows duplicate groups and rows that would be removed
--   2) Deletes older duplicate rows, keeping only the latest row per tenant_id
--   3) Adds a UNIQUE index on tenant_id to prevent future duplicates
--
-- Safety:
--   - Run in Supabase SQL editor as a privileged role (service role / postgres).
--   - Wrapped in a transaction.
--   - Review SELECT outputs before COMMIT.
--   - If anything looks wrong, run ROLLBACK instead of COMMIT.
-- =============================================================================

BEGIN;

-- 0) Quick duplicate summary (before cleanup)
SELECT
  tenant_id,
  COUNT(*) AS row_count
FROM public.site_settings
GROUP BY tenant_id
HAVING COUNT(*) > 1
ORDER BY row_count DESC, tenant_id;

-- 1) Preview rows that would be deleted (older duplicates)
WITH ranked AS (
  SELECT
    id,
    tenant_id,
    currency,
    updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id
      ORDER BY updated_at DESC, id DESC
    ) AS rn
  FROM public.site_settings
)
SELECT
  id,
  tenant_id,
  currency,
  updated_at
FROM ranked
WHERE rn > 1
ORDER BY tenant_id, updated_at DESC, id DESC;

-- 2) Delete duplicates (keep rn = 1 only)
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

-- 3) Verify no duplicates remain
SELECT
  tenant_id,
  COUNT(*) AS row_count
FROM public.site_settings
GROUP BY tenant_id
HAVING COUNT(*) > 1
ORDER BY row_count DESC, tenant_id;

-- 4) Prevent regression: one settings row per tenant
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_tenant_id_unique_idx
ON public.site_settings (tenant_id);

COMMIT;

