import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

let cachedPlatformMaintenance: boolean | null = null;

export function usePlatformMaintenanceMode(): { isEnabled: boolean; loading: boolean } {
  const [isEnabled, setIsEnabled] = useState<boolean>(cachedPlatformMaintenance ?? false);
  const [loading, setLoading] = useState(cachedPlatformMaintenance === null);

  const fetchMode = async () => {
    const { data } = await (supabase as any)
      .from("saas_platform_settings")
      .select("setting_value")
      .eq("setting_key", "maintenance_mode")
      .maybeSingle();
    const val = data?.setting_value === "true";
    cachedPlatformMaintenance = val;
    setIsEnabled(val);
    setLoading(false);
  };

  useEffect(() => {
    if (cachedPlatformMaintenance !== null) {
      setIsEnabled(cachedPlatformMaintenance);
      setLoading(false);
    } else {
      fetchMode();
    }

    // Realtime: re-read whenever saas_platform_settings changes
    const channel = supabase
      .channel("platform_maintenance_watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "saas_platform_settings" },
        () => {
          cachedPlatformMaintenance = null;
          fetchMode();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isEnabled, loading };
}
