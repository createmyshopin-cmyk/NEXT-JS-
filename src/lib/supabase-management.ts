import { NextResponse } from "next/server";

export async function addDomainToSupabaseAuth(domain: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = process.env.SUPABASE_MANAGEMENT_TOKEN;
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;

    if (!token || !projectRef) {
      console.warn("Skipping auto-sync: Missing SUPABASE_MANAGEMENT_TOKEN or NEXT_PUBLIC_SUPABASE_PROJECT_REF");
      return { success: false, error: "Missing configuration" };
    }

    // The wildcard syntax Supabase expects
    const newRules = [`https://${domain}/*`, `https://www.${domain}/*`];

    // GET current config
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Failed to fetch auth config: ${res.status} ${err}` };
    }

    const config = await res.json();
    const currentAllowList = typeof config.uri_allow_list === "string" ? config.uri_allow_list : "";
    
    // Parse current URLs into a set for deduplication
    const rules = currentAllowList.split(',').map((r: string) => r.trim()).filter(Boolean);
    const rulesSet = new Set(rules);
    
    let changed = false;
    for (const rule of newRules) {
      if (!rulesSet.has(rule)) {
        rulesSet.add(rule);
        changed = true;
      }
    }

    // Only update if changes were made
    if (!changed) {
      return { success: true };
    }

    const updatedAllowList = Array.from(rulesSet).join(",");

    // PATCH updated config back to Supabase
    const patchRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uri_allow_list: updatedAllowList,
      }),
    });

    if (!patchRes.ok) {
      const err = await patchRes.text();
      return { success: false, error: `Failed to update auth config: ${patchRes.status} ${err}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error parsing config" };
  }
}
