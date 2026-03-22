import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantFromHostnameDb } from "@/lib/resolveTenantFromHost";
import { platformBaseDomainFromEnv } from "@/lib/redirectTenantAdminDashboard";

/** Build the marketing host login URL (e.g. https://travelvoo.in/login). */
function marketingLoginUrl(): string {
  const base = platformBaseDomainFromEnv();
  const proto =
    typeof window !== "undefined" && window.location.protocol === "http:" ? "http:" : "https:";
  return `${proto}//${base}/login`;
}

/**
 * Resolves the current hostname to a tenant_id via tenant_domains + platform apex rules.
 * Returns null on marketing apex, localhost, or non-tenant hosts.
 */
export async function resolveTenantFromHostname(): Promise<string | null> {
  const { tenant } = await resolveTenantFromHostnameDb(supabase, window.location.hostname);
  return tenant?.id ?? null;
}

export function useAdminAuth() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        router.replace("/admin/login");
        return;
      }

      setUser(session.user);

      // Verify the user has the admin role
      const { data: hasRole, error: roleError } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      if (roleError || !hasRole) {
        setLoading(false);
        router.replace("/admin/login");
        return;
      }

      // Resolve which tenant this subdomain belongs to
      const resolvedTenantId = await resolveTenantFromHostname();

      if (resolvedTenantId) {
        // Verify the logged-in user actually owns this tenant
        const { data: tenantRow } = await supabase
          .from("tenants")
          .select("id")
          .eq("id", resolvedTenantId)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!tenantRow) {
          // This user is an admin but NOT the owner of this specific subdomain
          await supabase.auth.signOut({ scope: "local" });
          setLoading(false);
          router.replace("/admin/login");
          return;
        }

        setTenantId(resolvedTenantId);
      } else {
        // No subdomain (localhost / root domain).
        // Look up the tenant that belongs to THIS specific logged-in user.
        // Must match user_id exactly — never fall back to "first tenant in DB".
        const { data: tenantRow } = await supabase
          .from("tenants")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!tenantRow) {
          // Authenticated admin but no tenant found for their user_id (e.g. super_admin
          // with no personal tenant). Allow access but without a specific tenant scope.
          setTenantId(null);
        } else {
          setTenantId(tenantRow.id);
        }
      }

      setIsAdmin(true);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAdmin(false);
        setUser(null);
        setTenantId(null);
        // Session cleared — hard-navigate to marketing login
        window.location.replace(marketingLoginUrl());
      }
    });

    checkAdmin();

    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut({ scope: "local" });
    // Hard-navigate to marketing host login (cross-origin from tenant subdomain)
    window.location.replace(marketingLoginUrl());
  };

  return { loading, isAdmin, user, tenantId, signOut };
}
