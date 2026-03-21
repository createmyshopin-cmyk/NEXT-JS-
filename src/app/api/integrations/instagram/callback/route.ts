import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/integrations/supabase/service-role";
import { getMetaPlatformCredentials } from "@/lib/meta-credentials";
import { parseInstagramOAuthState } from "@/lib/instagram-oauth-state";
import { resolveInstagramOAuthRedirectUri } from "@/lib/instagram-oauth-redirect";
import { encrypt } from "@/lib/encryption";

const TOKEN_KEY_ENV = "INSTAGRAM_TOKEN_ENCRYPTION_KEY";

/** Meta OAuth callback: exchange code for tokens, store connection. Supports Instagram Business Login and Facebook Login. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(new URL("/admin/instagram-bot/setup?error=oauth_denied", req.nextUrl.origin));
  }

  const parsed = parseInstagramOAuthState(state);
  if (!parsed?.tenantId) {
    return NextResponse.redirect(new URL("/admin/instagram-bot/setup?error=invalid_state", req.nextUrl.origin));
  }

  const { tenantId, flow } = parsed;

  const creds = await getMetaPlatformCredentials();
  if (!creds.metaAppSecret) {
    return NextResponse.redirect(new URL("/admin/instagram-bot/setup?error=meta_not_configured", req.nextUrl.origin));
  }

  const redirectUri = resolveInstagramOAuthRedirectUri(req, creds);
  const graphVersion = creds.graphApiVersion || "v25.0";

  try {
    if (flow === "instagram") {
      const igId = creds.instagramAppId?.trim();
      if (!igId) {
        return NextResponse.redirect(new URL("/admin/instagram-bot/setup?error=meta_not_configured", req.nextUrl.origin));
      }

      const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: igId,
          client_secret: creds.metaAppSecret,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("[instagram-oauth] Instagram token exchange failed:", tokenRes.status, errText, "redirect_uri used:", redirectUri);
        let reason = "";
        try {
          const j = JSON.parse(errText) as { error_message?: string; error_type?: string };
          const msg = (j.error_message || j.error_type || "").toLowerCase();
          if (msg.includes("redirect") || msg.includes("redirect_uri")) {
            reason = "redirect_uri_mismatch";
          } else if (msg.includes("code") || msg.includes("invalid")) {
            reason = "invalid_or_expired_code";
          }
        } catch {
          /* plain text */
        }
        const u = new URL("/admin/instagram-bot/setup", req.nextUrl.origin);
        u.searchParams.set("error", "token_exchange_failed");
        if (reason) u.searchParams.set("reason", reason);
        return NextResponse.redirect(u);
      }

      const tokenJson = (await tokenRes.json()) as { access_token: string; user_id?: string };
      const shortToken = tokenJson.access_token;
      if (!shortToken) {
        return NextResponse.redirect(new URL("/admin/instagram-bot/setup?error=token_exchange_failed", req.nextUrl.origin));
      }

      const longUrl = `https://graph.instagram.com/access_token?${new URLSearchParams({
        grant_type: "ig_exchange_token",
        client_secret: creds.metaAppSecret,
        access_token: shortToken,
      })}`;
      const longRes = await fetch(longUrl);
      const longData = longRes.ok
        ? ((await longRes.json()) as { access_token: string; expires_in?: number })
        : { access_token: shortToken, expires_in: undefined };

      const longToken = longData.access_token;
      const expiresAt = longData.expires_in
        ? new Date(Date.now() + longData.expires_in * 1000).toISOString()
        : null;

      let igBizId = "";
      let igUsername = "";
      const meUrl = `https://graph.instagram.com/${graphVersion}/me?fields=id,username&access_token=${encodeURIComponent(longToken)}`;
      const meRes = await fetch(meUrl);
      if (meRes.ok) {
        const me = (await meRes.json()) as { id?: string; username?: string };
        igBizId = me.id || "";
        igUsername = me.username || "";
      }
      if (!igBizId && tokenJson.user_id) {
        igBizId = String(tokenJson.user_id);
      }
      if (!igBizId) {
        return NextResponse.redirect(new URL("/admin/instagram-bot/setup?error=no_instagram_account", req.nextUrl.origin));
      }

      const encryptedToken = encrypt(longToken, TOKEN_KEY_ENV);
      const sb = createServiceRoleClient();

      await sb.from("tenant_instagram_connections" as any).upsert(
        {
          tenant_id: tenantId,
          facebook_page_id: igBizId,
          instagram_business_account_id: igBizId,
          page_access_token_encrypted: encryptedToken,
          token_expires_at: expiresAt,
          ig_username: igUsername,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "tenant_id" },
      );

      await sb.from("instagram_automation_config" as any).upsert(
        { tenant_id: tenantId } as any,
        { onConflict: "tenant_id" },
      );

      return NextResponse.redirect(new URL("/admin/instagram-bot/setup?success=connected", req.nextUrl.origin));
    }

    if (!creds.metaAppId?.trim()) {
      return NextResponse.redirect(new URL("/admin/instagram-bot/setup?error=meta_not_configured", req.nextUrl.origin));
    }

    const tokenRes = await fetch(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token?` +
      new URLSearchParams({
        client_id: creds.metaAppId,
        redirect_uri: redirectUri,
        client_secret: creds.metaAppSecret,
        code,
      }),
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[instagram-oauth] Facebook token exchange failed:", tokenRes.status, errText, "redirect_uri used:", redirectUri);
      let reason = "";
      try {
        const j = JSON.parse(errText) as { error?: { message?: string } };
        const msg = (j.error?.message || "").toLowerCase();
        if (msg.includes("redirect") || msg.includes("redirect_uri")) reason = "redirect_uri_mismatch";
      } catch {
        /* */
      }
      const u = new URL("/admin/instagram-bot/setup", req.nextUrl.origin);
      u.searchParams.set("error", "token_exchange_failed");
      if (reason) u.searchParams.set("reason", reason);
      return NextResponse.redirect(u);
    }

    const tokenData = (await tokenRes.json()) as { access_token: string; token_type: string; expires_in?: number };

    const longRes = await fetch(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: creds.metaAppId,
        client_secret: creds.metaAppSecret,
        fb_exchange_token: tokenData.access_token,
      }),
    );

    const longData = longRes.ok
      ? ((await longRes.json()) as { access_token: string; expires_in?: number })
      : { access_token: tokenData.access_token, expires_in: tokenData.expires_in };

    const longToken = longData.access_token;
    const expiresAt = longData.expires_in
      ? new Date(Date.now() + longData.expires_in * 1000).toISOString()
      : null;

    const pagesRes = await fetch(
      `https://graph.facebook.com/${graphVersion}/me/accounts?access_token=${longToken}&fields=id,name,access_token,instagram_business_account`,
    );
    const pagesData = (await pagesRes.json()) as { data?: { id: string; name: string; access_token: string; instagram_business_account?: { id: string } }[] };

    const page = (pagesData.data ?? []).find((p) => p.instagram_business_account);
    if (!page || !page.instagram_business_account) {
      return NextResponse.redirect(new URL("/admin/instagram-bot/setup?error=no_instagram_account", req.nextUrl.origin));
    }

    const pageToken = page.access_token;
    const igBizId = page.instagram_business_account.id;

    let igUsername = "";
    try {
      const igRes = await fetch(
        `https://graph.facebook.com/${graphVersion}/${igBizId}?fields=username&access_token=${pageToken}`,
      );
      const igData = (await igRes.json()) as { username?: string };
      igUsername = igData.username || "";
    } catch { /* optional */ }

    const encryptedToken = encrypt(pageToken, TOKEN_KEY_ENV);
    const sb = createServiceRoleClient();

    await sb.from("tenant_instagram_connections" as any).upsert(
      {
        tenant_id: tenantId,
        facebook_page_id: page.id,
        instagram_business_account_id: igBizId,
        page_access_token_encrypted: encryptedToken,
        token_expires_at: expiresAt,
        ig_username: igUsername,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "tenant_id" },
    );

    await sb.from("instagram_automation_config" as any).upsert(
      { tenant_id: tenantId } as any,
      { onConflict: "tenant_id" },
    );

    return NextResponse.redirect(new URL("/admin/instagram-bot/setup?success=connected", req.nextUrl.origin));
  } catch (err) {
    console.error("[instagram-oauth] Callback error:", err);
    return NextResponse.redirect(new URL("/admin/instagram-bot/setup?error=unexpected", req.nextUrl.origin));
  }
}
