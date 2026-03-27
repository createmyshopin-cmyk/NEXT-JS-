const SUPABASE_STORAGE_SEGMENT = "/storage/v1/object/public/";

interface TransformOptions {
  width?: number;
  quality?: number;
  format?: "origin" | "webp" | "avif";
}

/**
 * Applies Supabase image transformation params for public storage assets.
 * Non-Supabase URLs and data URIs are returned unchanged.
 */
export function withSupabaseImageTransform(url: string, opts: TransformOptions = {}): string {
  const src = (url || "").trim();
  if (!src || src.startsWith("data:")) return src;
  if (!src.includes(SUPABASE_STORAGE_SEGMENT)) return src;

  const width = opts.width ?? 720;
  const quality = opts.quality ?? 65;
  const format = opts.format ?? "webp";

  try {
    const u = new URL(src);
    if (width > 0) u.searchParams.set("width", String(width));
    if (quality > 0) u.searchParams.set("quality", String(quality));
    if (format !== "origin") u.searchParams.set("format", format);
    return u.toString();
  } catch {
    return src;
  }
}

