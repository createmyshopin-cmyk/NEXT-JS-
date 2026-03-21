import { createServiceRoleClient } from "@/integrations/supabase/service-role";
import { decrypt } from "@/lib/encryption";

export interface MetaPlatformCredentials {
  /** Facebook App ID (Settings → Basic) — used for Facebook Login OAuth. */
  metaAppId: string;
  /** Instagram app ID (Instagram product in App Dashboard) — used for instagram.com OAuth when set. */
  instagramAppId: string;
  metaAppSecret: string;
  webhookVerifyToken: string;
  graphApiVersion: string;
  oauthRedirectUri: string;
}

const META_KEY_ENV = "META_CREDENTIALS_ENCRYPTION_KEY";

/**
 * Resolve Meta platform credentials: DB first, then env fallback.
 * Runs server-side only (service role).
 */
export async function getMetaPlatformCredentials(): Promise<MetaPlatformCredentials> {
  /** Used when DB row exists but full creds branch does not return (webhook + OAuth redirect must still resolve). */
  let webhookFromDb = "";
  let oauthFromDb = "";

  try {
    const sb = createServiceRoleClient();
    const { data } = await sb
      .from("saas_meta_platform_config" as any)
      .select("meta_app_id, instagram_app_id, app_secret_encrypted, webhook_verify_token, graph_api_version, oauth_redirect_uri")
      .maybeSingle();

    if (data) {
      const row = data as any;
      webhookFromDb = String(row.webhook_verify_token ?? "").trim();
      oauthFromDb = String(row.oauth_redirect_uri ?? "").trim();

      let secret = "";
      if (row.app_secret_encrypted) {
        try {
          secret = decrypt(row.app_secret_encrypted, META_KEY_ENV);
        } catch {
          secret = "";
        }
      }
      const hasFb = !!(row.meta_app_id && String(row.meta_app_id).trim());
      const hasIg = !!(row.instagram_app_id && String(row.instagram_app_id).trim());
      if (secret && (hasFb || hasIg)) {
        return {
          metaAppId: row.meta_app_id || "",
          instagramAppId: row.instagram_app_id || "",
          metaAppSecret: secret,
          webhookVerifyToken: webhookFromDb || process.env.META_WEBHOOK_VERIFY_TOKEN || "",
          graphApiVersion: row.graph_api_version || "v25.0",
          oauthRedirectUri: row.oauth_redirect_uri || process.env.INSTAGRAM_OAUTH_REDIRECT_URI || "",
        };
      }
    }
  } catch {
    // DB unavailable — fall through to env
  }

  return {
    metaAppId: process.env.META_APP_ID || "",
    instagramAppId: process.env.INSTAGRAM_APP_ID || "",
    metaAppSecret: process.env.META_APP_SECRET || "",
    webhookVerifyToken: webhookFromDb || process.env.META_WEBHOOK_VERIFY_TOKEN || "",
    graphApiVersion: "v25.0",
    oauthRedirectUri: oauthFromDb || process.env.INSTAGRAM_OAUTH_REDIRECT_URI || "",
  };
}
