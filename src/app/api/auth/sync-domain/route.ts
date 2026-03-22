import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { addDomainToSupabaseAuth } from "@/lib/supabase-management";
import { rateLimitMemory } from "@/lib/rate-limit-memory";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient<Database>(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimitMemory(`sync-domain:${uid}`, 10);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Check roles: must be either admin or super_admin
  const [{ data: isSuper }, { data: isAdmin }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: uid, _role: "super_admin" }),
    supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
  ]);

  if (!isSuper && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { domain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const domain = body.domain?.trim().toLowerCase();
  if (!domain || !domain.includes(".") || domain.includes(" ") || domain.includes("/")) {
    return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
  }

  // Use the utility to call the Supabase Management API
  const result = await addDomainToSupabaseAuth(domain);
  
  if (!result.success) {
    console.warn(`[sync-domain] Failed to sync ${domain}:`, result.error);
    return NextResponse.json({ error: "Failed to sync domain to Supabase Auth configuration", detail: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, domain });
}
