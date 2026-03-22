import type { CookieOptionsWithName } from "@supabase/ssr";
import { isLocalOrPreviewHostname } from "@/lib/resolveTenantFromHost";

function normalizeBaseDomain(raw: string): string {
  let s = raw.trim().toLowerCase().replace(/^\./, "");
  if (s.startsWith("www.")) s = s.slice(4);
  return s;
}

/** Matches `platformBaseDomainFromEnv` default — used when platform env is unset. */
const DEFAULT_PLATFORM_BASE = "travelvoo.in";

/**
 * Parent domain for auth cookies so `www`, tenant subdomains, and apex share one session.
 * Set `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` or `NEXT_PUBLIC_PLATFORM_BASE_DOMAIN`.
 * When both are omitted, hosts under `*.travelvoo.in` still get `.travelvoo.in` so signup → tenant subdomain keeps the session.
 * Omitted on localhost / preview hosts (host-only cookies).
 */
export function getAuthCookieDomainForHostname(hostname: string): string | undefined {
  const h = hostname.toLowerCase();
  if (isLocalOrPreviewHostname(h)) return undefined;
  if (h === "127.0.0.1") return undefined;

  const explicit =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim() : undefined;
  if (explicit) {
    return explicit.startsWith(".") ? explicit : `.${explicit}`;
  }

  const raw =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN?.trim() ?? "" : "";
  const base = normalizeBaseDomain(raw) || DEFAULT_PLATFORM_BASE;

  if (h === base || h === `www.${base}` || h.endsWith(`.${base}`)) {
    return `.${base}`;
  }
  return undefined;
}

export function getAuthCookieOptionsForHostname(hostname: string): CookieOptionsWithName {
  const domain = getAuthCookieDomainForHostname(hostname);
  const secure =
    !isLocalOrPreviewHostname(hostname) && hostname !== "localhost" && hostname !== "127.0.0.1";

  return {
    path: "/",
    sameSite: "lax",
    secure,
    ...(domain ? { domain } : {}),
  };
}
