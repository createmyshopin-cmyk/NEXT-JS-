import type { Stay } from "@/types/stay";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the path segment is a stay row UUID (legacy / bookmarked links). */
export function looksLikeStayUuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

/**
 * Path segment for `/stay/[segment]`: prefers human-readable `stayId` (DB `stay_id`), else UUID `id`.
 */
export function stayPublicSegment(stay: Pick<Stay, "id" | "stayId">): string {
  const slug = stay.stayId?.trim();
  if (slug) return encodeURIComponent(slug);
  return stay.id;
}

export function stayPublicPath(stay: Pick<Stay, "id" | "stayId">): string {
  return `/stay/${stayPublicSegment(stay)}`;
}

export function stayPublicAbsoluteUrl(origin: string, stay: Pick<Stay, "id" | "stayId">): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${stayPublicPath(stay)}`;
}

/** For rows shaped like `{ id, stay_id }` from Supabase selects. */
export function stayPathFromIds(row: { id: string; stay_id: string }): string {
  const slug = row.stay_id?.trim();
  if (slug) return `/stay/${encodeURIComponent(slug)}`;
  return `/stay/${row.id}`;
}
