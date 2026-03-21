import type { NextRequest } from "next/server";
import type { MetaPlatformCredentials } from "@/lib/meta-credentials";

const CALLBACK_PATH = "/api/integrations/instagram/callback";

/**
 * OAuth redirect URI must be **byte-identical** in:
 * - Authorize URL
 * - Token exchange POST
 * - Meta Developer → Valid OAuth Redirect URIs
 *
 * Prefer SaaS Admin `oauth_redirect_uri`, then `NEXT_PUBLIC_APP_URL`, then request origin
 * (avoids www vs non-www mismatches between auth and callback).
 */
export function resolveInstagramOAuthRedirectUri(
  req: NextRequest,
  creds: Pick<MetaPlatformCredentials, "oauthRedirectUri">,
): string {
  const fromDb = (creds.oauthRedirectUri ?? "").trim();
  if (fromDb) return fromDb;

  const canonical = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim();
  if (canonical) {
    return `${canonical}${CALLBACK_PATH}`;
  }

  return `${req.nextUrl.origin}${CALLBACK_PATH}`;
}
