import type { SupabaseClient } from "@supabase/supabase-js";
import { isTenantLoginMarketingRedirectHost } from "@/lib/resolveTenantFromHost";

/**
 * On marketing apex / www (no tenant in hostname), send the tenant admin to their subdomain dashboard.
 * On tenant hosts or when subdomain is unknown, stay on current origin with `/admin/dashboard`.
 */
export async function redirectTenantAdminDashboard(
  supabase: SupabaseClient,
  userId: string,
  router: { replace: (href: string) => void }
): Promise<void> {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  if (isTenantLoginMarketingRedirectHost(hostname)) {
    const { data: tenant } = await supabase.from("tenants").select("id").eq("user_id", userId).maybeSingle();
    if (tenant) {
      const { data: domain } = await supabase
        .from("tenant_domains")
        .select("subdomain")
        .eq("tenant_id", tenant.id)
        .not("subdomain", "is", null)
        .limit(1)
        .maybeSingle();
      const { data: suffixRow } = await supabase
        .from("saas_platform_settings")
        .select("setting_value")
        .eq("setting_key", "platform_subdomain_suffix")
        .maybeSingle();
      const suffix = suffixRow?.setting_value || ".travelvoo.in";
      const baseDomain = suffix.replace(/^\./, "");
      if (domain?.subdomain && baseDomain) {
        window.location.href = `https://${domain.subdomain}.${baseDomain}/admin/dashboard`;
        return;
      }
    }
  }
  router.replace("/admin/dashboard");
}
