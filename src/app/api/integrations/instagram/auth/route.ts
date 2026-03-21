import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { checkInstagramEntitlement } from "@/lib/instagram-entitlement";
import { getMetaPlatformCredentials } from "@/lib/meta-credentials";
import { randomBytes } from "crypto";

/** Start Meta OAuth for the tenant admin. Prefers Instagram (instagram.com) when Instagram App ID is set in SaaS Admin. */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const tokenParam = req.nextUrl.searchParams.get("token");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : tokenParam;
  if (!bearer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { data: userData, error: authError } = await sb.auth.getUser(bearer);
  if (authError || !userData.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tenantId } = await sb.rpc("get_my_tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant context" }, { status: 400 });
  }

  const ent = await checkInstagramEntitlement(sb, tenantId);
  if (!ent.entitled) {
    return NextResponse.json({ error: ent.reason || "Not entitled" }, { status: 403 });
  }

  const creds = await getMetaPlatformCredentials();
  if (!creds.metaAppSecret) {
    return NextResponse.json({ error: "Meta App Secret not configured" }, { status: 503 });
  }

  const redirectUri = creds.oauthRedirectUri || `${req.nextUrl.origin}/api/integrations/instagram/callback`;
  const nonce = randomBytes(16).toString("hex");

  const instagramAppId = creds.instagramAppId?.trim();
  if (instagramAppId) {
    const state = `${tenantId}|${nonce}|ig`;
    const scopes = [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
      "instagram_business_content_publish",
      "instagram_business_manage_insights",
    ].join(",");
    const oauthUrl =
      `https://www.instagram.com/oauth/authorize?` +
      new URLSearchParams({
        client_id: instagramAppId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scopes,
        state,
        force_reauth: "true",
      }).toString();
    return NextResponse.redirect(oauthUrl);
  }

  if (!creds.metaAppId?.trim()) {
    return NextResponse.json(
      { error: "Configure Instagram App ID or Facebook App ID in SaaS Admin → Meta / Instagram API" },
      { status: 503 },
    );
  }

  const state = `${tenantId}|${nonce}|fb`;
  const scopes = [
    "instagram_basic",
    "instagram_manage_messages",
    "pages_manage_metadata",
    "pages_show_list",
    "pages_read_engagement",
  ].join(",");

  const oauthUrl = `https://www.facebook.com/${creds.graphApiVersion}/dialog/oauth?` +
    new URLSearchParams({
      client_id: creds.metaAppId,
      redirect_uri: redirectUri,
      state,
      scope: scopes,
      response_type: "code",
    }).toString();

  return NextResponse.redirect(oauthUrl);
}
