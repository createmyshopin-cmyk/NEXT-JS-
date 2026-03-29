import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { loginFailureDescription } from "@/lib/loginFailureMessage";
import { getAuthCookieOptionsForHostname } from "@/lib/auth-cookie-options";

/**
 * Password login + super_admin check via server-side fetch to Supabase.
 * Tokens are never returned in the response body — the server sets them
 * as HttpOnly cookies directly on the response using @supabase/ssr.
 */
export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !anonKey) {
    return NextResponse.json(
      { error: "Server missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" },
      { status: 500 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  // 1. Authenticate via Supabase token endpoint (server-to-server)
  const tokenRes = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ email, password }),
  });

  const tokenJson = (await tokenRes.json()) as Record<string, unknown>;

  if (!tokenRes.ok) {
    const raw =
      (tokenJson.error_description as string) ||
      (tokenJson.msg as string) ||
      (tokenJson.message as string) ||
      (tokenJson.error as string) ||
      "Invalid credentials";
    const msg = loginFailureDescription(String(raw));
    return NextResponse.json({ error: msg }, { status: tokenRes.status >= 400 ? tokenRes.status : 401 });
  }

  const access_token = tokenJson.access_token as string | undefined;
  const refresh_token = tokenJson.refresh_token as string | undefined;
  const user = tokenJson.user as { id?: string } | undefined;

  if (!access_token || !refresh_token || !user?.id) {
    return NextResponse.json({ error: "Unexpected auth response" }, { status: 502 });
  }

  // 2. Verify super_admin role
  const rpcRes = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/has_role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${access_token}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({ _user_id: user.id, _role: "super_admin" }),
  });

  const rpcText = await rpcRes.text();
  let isSuper = false;
  try {
    const parsed = JSON.parse(rpcText) as boolean | unknown;
    isSuper = parsed === true;
  } catch {
    isSuper = rpcText.trim() === "true";
  }

  if (!rpcRes.ok || !isSuper) {
    return NextResponse.json(
      { error: "Access denied: not a super admin (or has_role / schema missing on this project)." },
      { status: 403 }
    );
  }

  // 3. Set session server-side as HttpOnly cookies — tokens never reach the client body
  const hostname = new URL(req.url).hostname;
  // strictHost: true — admin session cookie is bound to this exact hostname only,
  // preventing tenant subdomains from inheriting the super-admin session.
  const cookieOpts = getAuthCookieOptionsForHostname(hostname, { strictHost: true });
  const response = NextResponse.json({ success: true });

  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: cookieOpts,
    cookies: {
      getAll() {
        return [];
      },
      setAll(items) {
        items.forEach(({ name, value, options }) => {
          cookiesToSet.push({ name, value, options });
        });
      },
    },
  });

  await supabase.auth.setSession({ access_token, refresh_token });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}
