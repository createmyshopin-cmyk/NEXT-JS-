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
      return jsonResponse({ error: "Unauthorized" });
    }

    const body = (await req.json()) as {
      email?: string;
      password?: string;
      tenant_name?: string;
      owner_name?: string;
      phone?: string;
      subdomain?: string;
      plan_id?: string;
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user?.id) {
      return jsonResponse({ error: "Invalid session" });
    }

    const { data: superRow } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!superRow) {
      return jsonResponse({ error: "Forbidden" });
    }

    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const tenantName = (body.tenant_name ?? "").trim();
    const ownerName = (body.owner_name ?? "").trim() || tenantName;
    const phone = (body.phone ?? "").trim() || "0";
    const subdomain = (body.subdomain ?? "").trim().toLowerCase();
    const planId = body.plan_id?.trim() || null;

    if (!email || !password || password.length < 6) {
      return jsonResponse({ error: "Valid email and password (min 6 chars) required" });
    }
    if (!tenantName) return jsonResponse({ error: "Tenant name is required" });
    if (!subdomain || subdomain.length < 2) return jsonResponse({ error: "Invalid subdomain" });
    if (!planId) return jsonResponse({ error: "Plan is required" });

    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr) {
      return jsonResponse({ error: authErr.message ?? "Could not create user" });
    }
    if (!created.user?.id) {
      return jsonResponse({ error: "Auth user was not created" });
    }

    try {
      await bootstrapTenant(admin, {
        userId: created.user.id,
        companyName: tenantName,
        email,
        phone,
        subdomain,
        planId,
      });
      await admin.from("tenants").update({ owner_name: ownerName }).eq("user_id", created.user.id);
    } catch (e) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw e;
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[create-tenant-admin]", msg);
    return jsonResponse({ error: msg || "Failed" });
  }
});
