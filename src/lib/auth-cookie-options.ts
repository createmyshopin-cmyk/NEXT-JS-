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
 * Parent domain for regular auth cookies so `www`, tenant subdomains, and apex share one session.
 * Omitted on localhost / preview hosts (host-only cookies).
 *
 * For privileged admin sessions (`strictHost: true`) the domain is intentionally omitted so the
 * cookie is host-only and cannot be read by sibling tenant subdomains.
 */
export function getAuthCookieDomainForHostname(
  hostname: string,
  { strictHost = false }: { strictHost?: boolean } = {}
): string | undefined {
  const h = hostname.toLowerCase();
  if (isLocalOrPreviewHostname(h)) return undefined;
  if (h === "127.0.0.1") return undefined;

  // Strict-host mode: no domain attribute → cookie is bound to the exact hostname only
  if (strictHost) return undefined;

  const raw =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN?.trim() ?? "" : "";
  const base = normalizeBaseDomain(raw) || DEFAULT_PLATFORM_BASE;

  if (h === base || h === `www.${base}` || h.endsWith(`.${base}`)) {
    const explicit =
      typeof process !== "undefined" ? process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim() : undefined;
    if (explicit) {
      return explicit.startsWith(".") ? explicit : `.${explicit}`;
    }
    return `.${base}`;
  }

  return undefined;
}

export function getAuthCookieOptionsForHostname(
  hostname: string,
  { strictHost = false }: { strictHost?: boolean } = {}
): CookieOptionsWithName {
  const domain = getAuthCookieDomainForHostname(hostname, { strictHost });
  const secure =
    !isLocalOrPreviewHostname(hostname) && hostname !== "localhost" && hostname !== "127.0.0.1";

  return {
    path: "/",
    sameSite: "lax",
    secure,
    httpOnly: true,
    ...(domain ? { domain } : {}),
  };
}
