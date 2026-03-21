import { NextRequest, NextResponse } from "next/server";
import { getMetaPlatformCredentials } from "@/lib/meta-credentials";

/**
 * Public: canonical Instagram webhook URL for Meta Developer Console.
 * Origin is aligned with SaaS Admin Meta settings (oauth_redirect_uri) or NEXT_PUBLIC_APP_URL — not the browser URL (avoids tenant /admin host issues).
 */
export async function GET(req: NextRequest) {
  const creds = await getMetaPlatformCredentials();
  let origin = "";

  if (creds.oauthRedirectUri?.trim()) {
    try {
      origin = new URL(creds.oauthRedirectUri.trim()).origin;
    } catch {
      /* ignore */
    }
  }

  if (!origin) {
    origin = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_WEBHOOK_PUBLIC_ORIGIN || "").replace(/\/$/, "").trim();
  }

  if (!origin) {
    const u = new URL(req.url);
    origin = `${u.protocol}//${u.host}`;
  }

  const webhookUrl = `${origin}/api/webhooks/instagram`;
  return NextResponse.json({ webhookUrl, origin });
}
