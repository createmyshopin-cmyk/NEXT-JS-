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
    const body = (await req.json()) as {
      companyName?: string;
      subdomain?: string;
      email?: string;
      password?: string;
      whatsappNumber?: string;
    };

    const companyName = (body.companyName ?? "").trim();
    const subdomain = (body.subdomain ?? "").trim().toLowerCase();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const phone = (body.whatsappNumber ?? "").replace(/\D/g, "") || "";

    if (!companyName) return jsonResponse({ error: "Company name is required" });
    if (!subdomain || subdomain.length < 2) return jsonResponse({ error: "Invalid subdomain" });
    if (!email) return jsonResponse({ error: "Email is required" });
    if (password.length < 6) return jsonResponse({ error: "Password must be at least 6 characters" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr) {
      const msg = authErr.message ?? "Could not create account";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
        return jsonResponse({ error: "An account with this email already exists" });
      }
      return jsonResponse({ error: msg });
    }
    if (!created.user?.id) {
      return jsonResponse({ error: "Auth user was not created" });
    }

    const { data: starterPlan } = await admin
      .from("plans")
      .select("id")
      .eq("status", "active")
      .order("price", { ascending: true })
      .limit(1)
      .maybeSingle();

    const planId = (starterPlan as { id?: string } | null)?.id ?? null;

    try {
      await bootstrapTenant(admin, {
        userId: created.user.id,
        companyName,
        email,
        phone,
        subdomain,
        planId,
      });
    } catch (e) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw e;
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[create-tenant-signup]", msg);
    return jsonResponse({ error: msg || "Signup failed" });
  }
});
