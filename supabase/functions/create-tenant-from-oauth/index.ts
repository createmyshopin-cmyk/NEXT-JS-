import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { bootstrapTenant } from "../_shared/bootstrap-tenant.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace(/^Bearer\s+/i, "")?.trim();
    if (!jwt) {
      return jsonResponse({ error: "Missing authorization" });
    }

    const body = (await req.json()) as {
      companyName?: string;
      subdomain?: string;
      whatsappNumber?: string;
    };

    const companyName = (body.companyName ?? "").trim();
    const subdomain = (body.subdomain ?? "").trim().toLowerCase();
    const phone = (body.whatsappNumber ?? "").replace(/\D/g, "") || "";

    if (!companyName) return jsonResponse({ error: "Company name is required" });
    if (!subdomain || subdomain.length < 2) return jsonResponse({ error: "Invalid subdomain" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user?.id) {
      return jsonResponse({ error: "Invalid session" });
    }

    const user = userData.user;
    const email = user.email ?? "";

    const { data: existing } = await admin
      .from("tenants")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return jsonResponse({ already_has_account: true });
    }

    const { data: starterPlan } = await admin
      .from("plans")
      .select("id")
      .eq("status", "active")
      .order("price", { ascending: true })
      .limit(1)
      .maybeSingle();

    const planId = (starterPlan as { id?: string } | null)?.id ?? null;

    await bootstrapTenant(admin, {
      userId: user.id,
      companyName,
      email,
      phone,
      subdomain,
      planId,
    });

    return jsonResponse({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[create-tenant-from-oauth]", msg);
    return jsonResponse({ error: msg || "Signup failed" });
  }
});
