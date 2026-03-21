import { supabase } from "@/integrations/supabase/client";

/**
 * Public pages: use TenantContext id when the host matches tenant_domains (subdomain/custom domain).
 * On apex/root hosts with no match (e.g. travelvoo.in before custom domain is verified), fall back to
 * `site_settings.tenant_id` so tenant-owned trips/stays match the primary site row — same idea as branding.
 */
export async function resolveEffectiveTenantId(
  contextTenantId: string | null
): Promise<string | null> {
  if (contextTenantId) return contextTenantId;

  const { data } = await (supabase.from("site_settings") as any)
    .select("tenant_id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const tid = data?.tenant_id as string | null | undefined;
  return tid ?? null;
}
