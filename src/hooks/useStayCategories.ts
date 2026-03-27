import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HomepageStayCategory {
  label: string;
  icon: string;
}

const ALL_STAYS_LABEL = "All Stays";
const ALL_STAYS_ICON = "Home";

export function useStayCategories() {
  const [categories, setCategories] = useState<HomepageStayCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("stay_categories") as any)
      .select("label, icon, sort_order")
      .eq("active", true)
      .order("sort_order");

    const mapped = (data || [])
      .map((d: any) => ({
        label: typeof d.label === "string" ? d.label.trim() : "",
        icon: typeof d.icon === "string" ? d.icon : "",
      }))
      .filter((d: HomepageStayCategory) => d.label.length > 0);

    const hasAllStays = mapped.some((d: HomepageStayCategory) => d.label.toLowerCase() === ALL_STAYS_LABEL.toLowerCase());
    const allStaysTab: HomepageStayCategory = { label: ALL_STAYS_LABEL, icon: ALL_STAYS_ICON };
    setCategories(hasAllStays ? mapped : [allStaysTab, ...mapped]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchCategories();

    const channel = supabase
      .channel("homepage_stay_categories")
      .on("postgres_changes", { event: "*", schema: "public", table: "stay_categories" }, () => {
        void fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCategories]);

  return { categories, loading };
}

