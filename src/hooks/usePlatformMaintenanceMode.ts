import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cachedPlatformMaintenance: boolean | null = null;

async function fetchPlatformMaintenanceMode(): Promise<boolean> {
  // Attempt 1: DB query (works if RLS allows SELECT on saas_platform_settings)
  try {
    const { data } = await (supabase as any)
      .from("saas_platform_settings")
      .select("setting_value")
      .eq("setting_key", "maintenance_mode")
      .maybeSingle();
    if (data !== null && data !== undefined) {
      return data?.setting_value === "true";
    }
  } catch { /* RLS may deny access — fall through */ }

  // Attempt 2: Read from localStorage where SaasAdminSettings writes cache
  try {
    const raw = localStorage.getItem("saas_platform_settings");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.maintenanceMode === "boolean") return parsed.maintenanceMode;
    }
  } catch { /* ignore */ }

  return false;
}

export function usePlatformMaintenanceMode(): { isEnabled: boolean; loading: boolean } {
  const [isEnabled, setIsEnabled] = useState<boolean>(cachedPlatformMaintenance ?? false);
  const [loading, setLoading] = useState(cachedPlatformMaintenance === null);

  const doFetch = async () => {
    const val = await fetchPlatformMaintenanceMode();
    cachedPlatformMaintenance = val;
    setIsEnabled(val);
    setLoading(false);
  };

  useEffect(() => {
    if (cachedPlatformMaintenance !== null) {
      setIsEnabled(cachedPlatformMaintenance);
      setLoading(false);
    } else {
      doFetch();
    }

    // Realtime: bust cache and re-fetch whenever saas_platform_settings changes
    // (works only if tenant has SELECT permission — otherwise polling localStorage is the fallback)
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("platform_maintenance_watch")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "saas_platform_settings" },
          () => {
            cachedPlatformMaintenance = null;
            doFetch();
          }
        )
        .subscribe();
    } catch { /* ignore if RLS blocks */ }

    // Poll localStorage every 5s as a reliable fallback for when
    // the DB realtime subscription is blocked by RLS for tenant users
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem("saas_platform_settings");
        if (raw) {
          const parsed = JSON.parse(raw);
          const val = typeof parsed.maintenanceMode === "boolean" ? parsed.maintenanceMode : false;
          if (val !== cachedPlatformMaintenance) {
            cachedPlatformMaintenance = val;
            setIsEnabled(val);
          }
        }
      } catch { /* ignore */ }
    }, 5000);

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isEnabled, loading };
}
